import * as Movie from "../models/movieModel.js";

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


export async function getMovies(req, res, next) {
    try {
        const { genre, minYear, sort } = req.query;

        let parsedMinYear;

        if (minYear !== undefined) {
            parsedMinYear = Number(minYear);

            if (minYear.trim() === "" || !Number.isInteger(parsedMinYear)) {
                return res.status(400).json({
                    error: {
                        code: "INVALID_MIN_YEAR",
                        message: "minYear must be a valid integer"
                    }
                });
            }
        }

        if (sort !== undefined && !["year", "title"].includes(sort)) {
            return res.status(400).json({
                error: {
                    code: "INVALID_SORT",
                    message: "sort must be either 'year' or 'title'"
                }
            });
        }

        const movies = await Movie.findAll({
            genre,
            minYear: parsedMinYear,
            sort
        });

        return res.status(200).json(movies);

    } catch (error) {
        next(error);
    }
}


export async function getMovieById(req, res, next) {
    try {
        const id = res.locals.movieId;

        const movie = await Movie.findById(id);

        if (!movie) {
            return res.status(404).json({
                error: {
                    code: "MOVIE_NOT_FOUND",
                    message: "Movie not found"
                }
            });
        }

        return res.status(200).json(movie);

    } catch (error) {
        next(error);
    }
}


export async function addMovie(req, res, next) {
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

        const movie = await Movie.create(req.body);

        return res
            .location(`/movies/${movie.id}`)
            .status(201)
            .json(movie);

    } catch (error) {
        next(error);
    }
}


export async function replaceMovie(req, res, next) {
    try {
        const id = res.locals.movieId;

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

        const movie = await Movie.replace(id, req.body);

        if (!movie) {
            return res.status(404).json({
                error: {
                    code: "MOVIE_NOT_FOUND",
                    message: "Movie not found"
                }
            });
        }

        return res.status(200).json(movie);

    } catch (error) {
        next(error);
    }
}


export async function updateMovie(req, res, next) {
    try {
        const id = res.locals.movieId;

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

        const allowedFields = ["title", "director", "year", "genre"];

        const hasValidFields = allowedFields.some(
            field => req.body[field] !== undefined
        );

        if (!hasValidFields) {
            return res.status(400).json({
                error: {
                    code: "NO_VALID_FIELDS",
                    message: "No valid fields provided for update"
                }
            });
        }

        const movie = await Movie.update(id, req.body);

        if (!movie) {
            return res.status(404).json({
                error: {
                    code: "MOVIE_NOT_FOUND",
                    message: "Movie not found"
                }
            });
        }

        return res.status(200).json(movie);

    } catch (error) {
        next(error);
    }
}


export async function deleteMovie(req, res, next) {
    try {
        const id = res.locals.movieId;

        const movie = await Movie.remove(id);

        if (!movie) {
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
}