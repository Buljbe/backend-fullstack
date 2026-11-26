export default function validateMovieId(req, res, next) {
    const { id } = req.params;

    if (!/^[1-9]\d*$/.test(id) || !Number.isSafeInteger(Number(id))) {
        return res.status(400).json({
            error: {
                code: "INVALID_MOVIE_ID",
                message: "Movie ID must be a positive integer"
            }
        });
    }

    res.locals.movieId = Number(id);

    next();
}