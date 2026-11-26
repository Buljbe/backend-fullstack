export default function validateMovie(schema) {
    return (req, res, next) => {
        const { error, value } = schema.validate(req.body, {
            abortEarly: false
        });

        if (error) {
            return res.status(400).json({
                error: {
                    code: "VALIDATION_ERROR",
                    message: "Movie data is invalid",
                    details: error.details.map(
                        detail => detail.message
                    )
                }
            });
        }

        req.body = value;

        next();
    };
}