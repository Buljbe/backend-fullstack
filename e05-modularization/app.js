import dotenv from "dotenv";
dotenv.config();

import express from "express";
import morgan from "morgan";
import pool from "./db.js";

import movieRouter from "./routes/movies.js";

import notFoundHandler from "./middleware/notFoundHandler.js";
import errorHandler from "./middleware/errorHandler.js";

const port = 3000;
const app = express();

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

app.use("/movies", movieRouter);

app.use(notFoundHandler);

app.use(errorHandler);

app.listen(port, () => {
    console.log(`Listening for API requests on localhost:${port}!`);
});