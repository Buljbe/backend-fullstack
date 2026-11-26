
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

const router = express.Router();

router.get("/", getMovies);
router.get("/:id", validateMovieId, getMovieById);
router.post("/", addMovie);
router.put("/:id", validateMovieId, replaceMovie);
router.patch("/:id", validateMovieId, updateMovie);
router.delete("/:id", validateMovieId, deleteMovie);

export default router;
