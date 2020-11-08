const factory = require('./handlerFactory');
const Movie = require('../models/Movie');

exports.topMovies = (req, res, next) => {
    req.query.limit = '5';
    req.query.sort = 'ratingsQuantity,ratingsAverage';
    req.query.fields = 'title,numberInStock,dailyRentalRate';
    next();
}

exports.getAllMovies = factory.getAll(Movie);
exports.getMovie = factory.getOne(Movie, 'reviews');
exports.createMovie = factory.createOne(Movie);
exports.updateMovie = factory.updateOne(Movie);
exports.deleteMovie = factory.deleteOne(Movie);