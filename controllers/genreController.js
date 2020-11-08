const factory = require('./handlerFactory');
const { Genre } = require('../models/Genre');

exports.getAllGenres = factory.getAll(Genre);
exports.getGenre = factory.getOne(Genre);
exports.createGenre = factory.createOne(Genre);
exports.updateGenre = factory.updateOne(Genre);
exports.deleteGenre = factory.deleteOne(Genre);