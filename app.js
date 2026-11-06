const port = 3000;

let movies = [
  {
    id: 1,
    title: "Inception",
    director: "Christopher Nolan",
    year: 2010
  },
  {
    id: 2,
    title: "The Matrix",
    director: "The Wachowskis",
    year: 1999
  },
  {
    id: 3,
    title: "Parasite",
    director: "Bong Joon-ho",
    year: 2019
  }
];

const express = require("express");

const app = express();

app.use(express.json());

app.get("/movies", (req, res) => {
    res.status(200).send(movies);
});

app.get("/movies/:id", (req, res) => {
    const id = req.params.id;
    if (isNaN(id) || id != parseInt(id)) {
        res.status(400).send({error: `The ID (${id}) is not an integer.`});
    }
    const index = movies.findIndex(movie => movie.id == id);
    if (index >= 0) { 
        res.status(200).send(movies[index]);
    } else {
        res.status(400).send({error: "Movie not found"});
    }
});

app.post("/movies", (req, res) => {
    const { title, director, year } = req.body;
    if (!title || !director || !year) {
        return res.status(400).send({
            error: "title, director and year are required"
        });
    } else {
        const movie = {
            id: movies.length + 1,
            title,
            director,
            year
        };
        movies.push(movie);
        res.status(201).send(movie);
    }
});

app.listen(3000, () => {
    console.log(`Listening for API requests on localhost:${port}!`);
});