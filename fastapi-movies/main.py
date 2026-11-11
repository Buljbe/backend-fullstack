
from fastapi import FastAPI, HTTPException, Response
from pydantic import BaseModel, field_validator
from datetime import datetime

app = FastAPI()

movies = [
    {
        "id": 1,
        "title": "Inception",
        "director": "Christopher Nolan",
        "year": 2010,
        "genre": "Sci-Fi"
    },
    {
        "id": 2,
        "title": "The Matrix",
        "director": "The Wachowskis",
        "year": 1999,
        "genre": "Action"
    },
    {
        "id": 3,
        "title": "Parasite",
        "director": "Bong Joon-ho",
        "year": 2019,
        "genre": "Thriller"
    }
]

MAXIMUM_YEAR = datetime.now().year + 5


class MovieCreate(BaseModel):
    title: str
    director: str
    year: int
    genre: str

    @field_validator("title", "genre")
    @classmethod
    def validate_string(cls, value):
        if not value.strip():
            raise ValueError("must be a non-empty string")
        return value

    @field_validator("year")
    @classmethod
    def validate_year(cls, value):
        if value < 1888 or value > MAXIMUM_YEAR:
            raise ValueError("year must be a valid integer")
        return value


class MovieUpdate(BaseModel):
    title: str | None = None
    director: str | None = None
    year: int | None = None
    genre: str | None = None

    @field_validator("title", "genre")
    @classmethod
    def validate_string(cls, value):
        if value is not None and not value.strip():
            raise ValueError("must be a non-empty string")
        return value

    @field_validator("year")
    @classmethod
    def validate_year(cls, value):
        if value is not None and (value < 1888 or value > MAXIMUM_YEAR):
            raise ValueError("year must be a valid integer")
        return value


@app.get("/")
def root():
    return {"message": "Hello from FastAPI"}


@app.get("/movies")
def get_movies(
    min_year: int | None = None,
    genre: str | None = None,
    sort: str | None = None
):
    result = movies.copy()

    if min_year is not None:
        result = [
            movie
            for movie in result
            if movie["year"] >= min_year
        ]

    if genre is not None:
        result = [
            movie
            for movie in result
            if movie["genre"].lower() == genre.lower()
        ]

    if sort == "year":
        result.sort(key=lambda movie: movie["year"])

    elif sort == "title":
        result.sort(key=lambda movie: movie["title"].lower())

    elif sort is not None:
        raise HTTPException(
            status_code=400,
            detail="sort must be either 'year' or 'title'"
        )

    return result


@app.get("/movies/{id}")
def get_movie(id: int):
    for movie in movies:
        if movie["id"] == id:
            return movie

    raise HTTPException(status_code=404, detail="Movie not found")


@app.post("/movies", status_code=201)
def create_movie(movie_data: MovieCreate):
    movie = {
        "id": max((m["id"] for m in movies), default=0) + 1,
        **movie_data.model_dump()
    }

    movies.append(movie)
    return movie


@app.put("/movies/{id}")
def replace_movie(id: int, movie_data: MovieCreate):
    for index, movie in enumerate(movies):
        if movie["id"] == id:
            updated_movie = {
                "id": id,
                **movie_data.model_dump()
            }

            movies[index] = updated_movie
            return updated_movie

    raise HTTPException(status_code=404, detail="Movie not found")


@app.patch("/movies/{id}")
def update_movie(id: int, movie_data: MovieUpdate):
    for movie in movies:
        if movie["id"] == id:
            update_data = movie_data.model_dump(exclude_unset=True)
            movie.update(update_data)
            return movie

    raise HTTPException(status_code=404, detail="Movie not found")


@app.delete("/movies/{id}", status_code=204)
def delete_movie(id: int):
    for index, movie in enumerate(movies):
        if movie["id"] == id:
            movies.pop(index)
            return Response(status_code=204)

    raise HTTPException(status_code=404, detail="Movie not found")
