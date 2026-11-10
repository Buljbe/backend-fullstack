import express from "express";
import morgan from "morgan";

const port = 3000;

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

const app = express();

app.use(express.json());
app.use(morgan("dev"));

app.get("/movies", (req, res) => {
    const { genre, minYear, sort } = req.query;
    let filteredMovies = [...movies];

    if (minYear !== undefined) {
        const year = Number(minYear);

        if (minYear.trim() === "" || !Number.isInteger(year)) {
            return res.status(400).send({
                error: {
                    code: "INVALID_MIN_YEAR",
                    message: "minYear must be a valid integer"
                }
            });
        }
        filteredMovies = filteredMovies.filter(
            movie => movie.year >= year
        );
    }

    if (genre !== undefined) {
        filteredMovies = filteredMovies.filter(
            movie => movie.genre.toLowerCase() === genre.toLowerCase()
        );
    }

    if (sort !== undefined) {
        if (sort === "year") {
            filteredMovies.sort((a, b) => a.year - b.year);
        } 
        else if (sort === "title") {
            filteredMovies.sort((a, b) =>
                a.title.localeCompare(b.title)
            );
        } 
        else {
            return res.status(400).send({
                error: {
                    code: "INVALID_SORT",
                    message: "sort must be either 'year' or 'title'"
                }
            });
        }
    }

    return res.status(200).send(filteredMovies);
});

app.get("/movies/:id", (req, res) => {
    const id = req.params.id;
    if (isNaN(id) || id != parseInt(id)) {
        return res.status(400).send(
            {error: {
                code: "ID_NOT_INTEGER",
                message: `The ID (${id}) is not an integer.`
            }});
    }
    const index = movies.findIndex(movie => movie.id == id);
    if (index >= 0) { 
        return res.status(200).send(movies[index]);
    } else {
        return res.status(404).send({error: {
            code: "MOVIE_NOT_FOUND",
            message: "Movie not found"
        }});
    }
});

app.post("/movies", (req, res) => {
    const errors = validateMovie(req.body);
    if (errors.length != 0) {
        const response = {
            error: {
                code: "VALIDATION_ERROR",
                message: "Movie data is invalid",
                details: errors
            }
        }
        return res.status(400).send(response);
    }
    const { title, director, year, genre } = req.body;
    const movie = {
        id: movies.length + 1,
        title,
        director,
        year,
        genre
    };
    movies.push(movie);
    return res.status(201).send(movie);
});

app.put("/movies/:id", (req, res) => {
    const id = req.params.id;
    if (isNaN(id) || id != parseInt(id)) {
        return res.status(400).send(
            {error: {
                code: "ID_NOT_INTEGER",
                message: `The ID (${id}) is not an integer.`
            }});
    }

    const index = movies.findIndex(movie => movie.id == id);
    if (index >= 0) { 
        const errors = validateMovie(req.body);
        if (errors.length != 0) {
            const response = {
                error: {
                    code: "VALIDATION_ERROR",
                    message: "Movie data is invalid",
                    details: errors
                }
            }
            return res.status(400).send(response);
        }
        const { title, director, year, genre } = req.body;
        const movie = {
            id: id,
            title: title,
            director: director,
            year: year,
            genre: genre
        };
        movies[index] = movie;
        return res.status(200).send(movie);
    } else {
        return res.status(404).send({error: {
            code: "MOVIE_NOT_FOUND",
            message: "Movie not found"
        }});
    }
});

app.patch("/movies/:id", (req, res) => {
    const id = req.params.id;
    if (isNaN(id) || id != parseInt(id)) {
        return res.status(400).send(
            {error: {
                code: "ID_NOT_INTEGER",
                message: `The ID (${id}) is not an integer.`
            }});
    }

    const index = movies.findIndex(movie => movie.id == id);
    if (index >= 0) { 
        let movie = movies[index];
        const errors = validateMovie(req.body, true);
        if (errors.length != 0) {
            const response = {
                error: {
                    code: "VALIDATION_ERROR",
                    message: "Movie data is invalid",
                    details: errors
                }
            }
            return res.status(400).send(response);
        }
        const { title, director, year, genre } = req.body;
        if (title !== undefined) {
            movie.title = title;
        }
        if (director !== undefined) {
            movie.director = director;
        }
        if (year !== undefined) {
            movie.year = year;
        }
        if (genre !== undefined) {
            movie.genre = genre;
        }
        return res.status(200).send(movie);
    } else {
        return res.status(404).send({error: {
            code: "MOVIE_NOT_FOUND",
            message: "Movie not found"
        }});
    }
});

app.delete("/movies/:id", (req, res) => {
    const id = req.params.id;
    if (isNaN(id) || id != parseInt(id)) {
        return res.status(400).send(
            {error: {
                code: "ID_NOT_INTEGER",
                message: `The ID (${id}) is not an integer.`
            }});
    }
    const index = movies.findIndex(movie => movie.id == id);
    if (index >= 0) { 
        movies.splice(index, 1);
        return res.status(204).send;
    } else {
        return res.status(404).send({error: {
            code: "MOVIE_NOT_FOUND",
            message: "Movie not found"
        }});
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

app.listen(3000, () => {
    console.log(`Listening for API requests on localhost:${port}!`);
});