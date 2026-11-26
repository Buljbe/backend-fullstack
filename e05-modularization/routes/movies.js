import express from "express";
import {
    getMovies,
    getMovieById,
    addMovie,
    replaceMovie,
    updateMovie,
    deleteMovie
} from "../controllers/movieController.js";
import validateMovieId from "../middleware/validateMovieId.js";
import validateMovie from "../middleware/validateMovie.js";
import {
    movieCreateSchema,
    movieUpdateSchema
} from "../validation/movieValidation.js";

const router = express.Router();

router.get("/", getMovies);
router.get("/:id", validateMovieId, getMovieById);

router.post(
    "/",
    validateMovie(movieCreateSchema),
    addMovie
);

router.put(
    "/:id",
    validateMovieId,
    validateMovie(movieCreateSchema),
    replaceMovie
);

router.patch(
    "/:id",
    validateMovieId,
    validateMovie(movieUpdateSchema),
    updateMovie
);

router.delete("/:id", validateMovieId, deleteMovie);

export default router;
