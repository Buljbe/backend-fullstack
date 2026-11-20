require("dotenv").config();

const express = require("express");
const morgan = require("morgan");
const pool = require("./db");

const port = 3000;
const app = express();

let movies = [
  {
    id: 1,
    title: "Inception",
    director: "Christopher Nolan",
    year: 2010,
    genre: "Sci-Fi"
  },
  {
    id: 2,
    title: "The Matrix",
    director: "The Wachowskis",
    year: 1999,
    genre: "Action"
  },
  {
    id: 3,
    title: "Parasite",
    director: "Bong Joon-ho",
    year: 2019,
    genre: "Thriller"
  }
];

function validateMovie(body, partial = false) {
  const errors = [];
  const maximumYear = new Date().getFullYear() + 5;

  if (!partial && body.title === undefined) {
    errors.push("title is required");
  }

  if (
    body.title !== undefined &&
    (typeof body.title !== "string" || body.title.trim().length === 0)
  ) {
    errors.push("title must be a non-empty string");
  }

  if (!partial && body.year === undefined) {
    errors.push("year is required");
  }

  if (
    body.year !== undefined &&
    (
      !Number.isInteger(body.year) ||
      body.year < 1888 ||
      body.year > maximumYear
    )
  ) {
    errors.push("year must be a valid integer");
  }

  if (!partial && body.genre === undefined) {
    errors.push("genre is required");
  }

  if (
    body.genre !== undefined &&
    (typeof body.genre !== "string" || body.genre.trim().length === 0)
  ) {
    errors.push("genre must be a non-empty string");
  }

  return errors;
}

app.use(express.json());
app.use(morgan("dev"));

app.get("/health/database", async (req, res, next) => {
    try {
        const result = await pool.query(
            "SELECT NOW() AS database_time"
        );

        res.json({
            status: "ok",
            databaseTime: result.rows[0].database_time
        });
    } catch (error) {
        next(error);
    }
});


app.get("/movies", async (req, res, next) => {
    try {
        const { genre, minYear, sort } = req.query;

        let query = `
            SELECT
                id,
                title,
                director,
                release_year AS year,
                genre
            FROM movies
        `;

        const conditions = [];
        const values = [];

        if (minYear !== undefined) {
            const year = Number(minYear);

            if (minYear.trim() === "" || !Number.isInteger(year)) {
                return res.status(400).json({
                    error: {
                        code: "INVALID_MIN_YEAR",
                        message: "minYear must be a valid integer"
                    }
                });
            }

            values.push(year);
            conditions.push(`release_year >= $${values.length}`);
        }

        if (genre !== undefined) {
            values.push(genre);
            conditions.push(`LOWER(genre) = LOWER($${values.length})`);
        }

        if (conditions.length > 0) {
            query += " WHERE " + conditions.join(" AND ");
        }

        if (sort !== undefined) {
            if (sort === "year") {
                query += " ORDER BY release_year ASC";
            } else if (sort === "title") {
                query += " ORDER BY title ASC";
            } else {
                return res.status(400).json({
                    error: {
                        code: "INVALID_SORT",
                        message: "sort must be either 'year' or 'title'"
                    }
                });
            }
        } else {
            query += " ORDER BY id";
        }

        const result = await pool.query(query, values);

        return res.status(200).json(result.rows);

    } catch (error) {
        next(error);
    }
});


app.get("/movies/:id", async (req, res, next) => {
    try {
        const id = req.params.id;

        if (!Number.isInteger(Number(id)) || id.trim() === "") {
            return res.status(400).json({
                error: {
                    code: "ID_NOT_INTEGER",
                    message: `The ID (${id}) is not an integer.`
                }
            });
        }

        const result = await pool.query(`
            SELECT
                id,
                title,
                director,
                release_year AS year,
                genre
            FROM movies
            WHERE id = $1
        `, [Number(id)]);

        if (result.rows.length === 0) {
            return res.status(404).json({
                error: {
                    code: "MOVIE_NOT_FOUND",
                    message: "Movie not found"
                }
            });
        }
        return res.status(200).json(result.rows[0]);

    } catch (error) {
        next(error);
    }
});


app.post("/movies", async (req, res, next) => {
    try {
        const errors = validateMovie(req.body);

        if (errors.length !== 0) {
            return res.status(400).json({
                error: {
                    code: "VALIDATION_ERROR",
                    message: "Movie data is invalid",
                    details: errors
                }
            });
        }

        const { title, director, year, genre } = req.body;

        const result = await pool.query(`
            INSERT INTO movies (
                title,
                director,
                release_year,
                genre
            )
            VALUES ($1, $2, $3, $4)
            RETURNING
                id,
                title,
                director,
                release_year AS year,
                genre
        `, [title, director ?? null, year, genre]);

        return res.status(201).json(result.rows[0]);

    } catch (error) {
        next(error);
    }
});


app.put("/movies/:id", async (req, res, next) => {
    try {
        const id = req.params.id;

        if (id.trim() === "" || !Number.isInteger(Number(id))) {
            return res.status(400).json({
                error: {
                    code: "ID_NOT_INTEGER",
                    message: `The ID (${id}) is not an integer.`
                }
            });
        }

        const errors = validateMovie(req.body);

        if (errors.length !== 0) {
            return res.status(400).json({
                error: {
                    code: "VALIDATION_ERROR",
                    message: "Movie data is invalid",
                    details: errors
                }
            });
        }

        const { title, director, year } = req.body;

        const result = await pool.query(`
            UPDATE movies
            SET
                title = $1,
                director = $2,
                release_year = $3
            WHERE id = $4
            RETURNING
                id,
                title,
                director,
                release_year AS year
        `, [title, director ?? null, year, Number(id)]);

        if (result.rows.length === 0) {
            return res.status(404).json({
                error: {
                    code: "MOVIE_NOT_FOUND",
                    message: "Movie not found"
                }
            });
        }
        return res.status(200).json(result.rows[0]);

    } catch (error) {
        next(error);
    }
});

app.patch("/movies/:id", async (req, res, next) => {
    try {
        const id = req.params.id;

        if (id.trim() === "" || !Number.isInteger(Number(id))) {
            return res.status(400).json({
                error: {
                    code: "ID_NOT_INTEGER",
                    message: `The ID (${id}) is not an integer.`
                }
            });
        }

        if (Object.keys(req.body).length === 0) {
            return res.status(400).json({
                error: {
                    code: "EMPTY_PATCH",
                    message: "PATCH request must contain at least one field"
                }
            });
        }

        const errors = validateMovie(req.body, true);

        if (errors.length !== 0) {
            return res.status(400).json({
                error: {
                    code: "VALIDATION_ERROR",
                    message: "Movie data is invalid",
                    details: errors
                }
            });
        }

        const allowedFields = {
            title: "title",
            director: "director",
            year: "release_year"
        };

        const setClauses = [];
        const values = [];

        for (const [field, column] of Object.entries(allowedFields)) {
            if (req.body[field] !== undefined) {
                values.push(req.body[field]);
                setClauses.push(`${column} = $${values.length}`);
            }
        }

        if (setClauses.length === 0) {
            return res.status(400).json({
                error: {
                    code: "NO_VALID_FIELDS",
                    message: "No valid fields provided for update"
                }
            });
        }

        values.push(Number(id));

        const query = `
            UPDATE movies
            SET ${setClauses.join(", ")}
            WHERE id = $${values.length}
            RETURNING
                id,
                title,
                director,
                release_year AS year,
                genre
        `;

        const result = await pool.query(query, values);

        if (result.rows.length === 0) {
            return res.status(404).json({
                error: {
                    code: "MOVIE_NOT_FOUND",
                    message: "Movie not found"
                }
            });
        }

        return res.status(200).json(result.rows[0]);

    } catch (error) {
        next(error);
    }
});

app.delete("/movies/:id", async (req, res, next) => {
    try {
        const id = req.params.id;

        if (id.trim() === "" || !Number.isInteger(Number(id))) {
            return res.status(400).json({
                error: {
                    code: "ID_NOT_INTEGER",
                    message: `The ID (${id}) is not an integer.`
                }
            });
        }

        const result = await pool.query(`
            DELETE FROM movies
            WHERE id = $1
            RETURNING id
        `, [Number(id)]);

        if (result.rows.length === 0) {
            return res.status(404).json({
                error: {
                    code: "MOVIE_NOT_FOUND",
                    message: "Movie not found"
                }
            });
        }

        return res.status(204).end();

    } catch (error) {
        next(error);
    }
});

app.use((req, res) => {
  res.status(404).json({
    error: {
      code: "ROUTE_NOT_FOUND",
      message: "The requested route does not exist"
    }
  });
});

app.use((err, req, res, next) => {
  console.error(err);

  res.status(500).json({
    error: {
      code: "INTERNAL_SERVER_ERROR",
      message: "An unexpected server error occurred"
    }
  });
});

app.listen(port, () => {
    console.log(`Listening for API requests on localhost:${port}!`);
});