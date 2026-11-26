export default function errorHandler(err, req, res, next) {
    console.error(err);

    res.status(500).json({
        error: {
            code: "INTERNAL_SERVER_ERROR",
            message: "An unexpected server error occurred"
        }
    });
}