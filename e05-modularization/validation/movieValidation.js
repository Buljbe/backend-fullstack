
import Joi from "joi";

const currentYear = new Date().getFullYear();

const movieFields = {
    title: Joi.string()
        .trim()
        .min(1)
        .max(255),

    director: Joi.string()
        .trim()
        .min(1)
        .max(255),

    year: Joi.number()
        .integer()
        .min(1888)
        .max(currentYear + 5),

    genre: Joi.string()
        .trim()
        .min(1)
        .max(255)
};


export const movieCreateSchema = Joi.object({
    title: movieFields.title.required(),
    director: movieFields.director.required(),
    year: movieFields.year.required(),
    genre: movieFields.genre.required()
}).unknown(false);


export const movieUpdateSchema = Joi.object({
    title: movieFields.title,
    director: movieFields.director,
    year: movieFields.year,
    genre: movieFields.genre
})
    .min(1)
    .unknown(false);
