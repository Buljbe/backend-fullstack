import * as Movie from "../models/movieModel.js";

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