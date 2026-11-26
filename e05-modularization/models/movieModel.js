import pool from "../db.js";

export async function findAll(filters = {}) {
    const { genre, minYear, sort } = filters;

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
        values.push(minYear);
        conditions.push(`release_year >= $${values.length}`);
    }

    if (genre !== undefined) {
        values.push(genre);
        conditions.push(`LOWER(genre) = LOWER($${values.length})`);
    }

    if (conditions.length > 0) {
        query += " WHERE " + conditions.join(" AND ");
    }

    if (sort === "year") {
        query += " ORDER BY release_year ASC";
    } else if (sort === "title") {
        query += " ORDER BY title ASC";
    } else {
        query += " ORDER BY id";
    }

    const result = await pool.query(query, values);

    return result.rows;
}


export async function findById(id) {
    const result = await pool.query(`
        SELECT
            id,
            title,
            director,
            release_year AS year,
            genre
        FROM movies
        WHERE id = $1
    `, [id]);

    return result.rows[0] || null;
}


export async function create(movie) {
    const { title, director, year, genre } = movie;

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

    return result.rows[0];
}


export async function replace(id, movie) {
    const { title, director, year, genre } = movie;

    const result = await pool.query(`
        UPDATE movies
        SET
            title = $1,
            director = $2,
            release_year = $3,
            genre = $4
        WHERE id = $5
        RETURNING
            id,
            title,
            director,
            release_year AS year,
            genre
    `, [title, director ?? null, year, genre, id]);

    return result.rows[0] || null;
}


export async function update(id, updates) {
    const allowedFields = {
        title: "title",
        director: "director",
        year: "release_year",
        genre: "genre"
    };

    const setClauses = [];
    const values = [];

    for (const [field, column] of Object.entries(allowedFields)) {
        if (updates[field] !== undefined) {
            values.push(updates[field]);
            setClauses.push(`${column} = $${values.length}`);
        }
    }

    if (setClauses.length === 0) {
        return null;
    }

    values.push(id);

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

    return result.rows[0] || null;
}


export async function remove(id) {
    const result = await pool.query(`
        DELETE FROM movies
        WHERE id = $1
        RETURNING id
    `, [id]);

    return result.rows[0] || null;
}
