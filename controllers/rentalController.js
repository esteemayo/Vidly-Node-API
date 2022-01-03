const Fawn = require('fawn');
const mongoose = require('mongoose');
const { StatusCodes } = require('http-status-codes');

const Movie = require('../models/Movie');
const Rental = require('../models/Rental');
const factory = require('./handlerFactory');
const AppError = require('../errors/appError');
const catchAsync = require('../utils/catchAsync');
const { Customer } = require('../models/Customer');
const BadRequestError = require('../errors/badRequest');

Fawn.init(mongoose);

exports.createRental = catchAsync(async (req, res, next) => {
  const customer = await Customer.findById(req.body.customer);
  if (!customer) return next(new BadRequestError('Invalid customer.'));

  const movie = await Movie.findById(req.body.movie);
  if (!movie) return next(new BadRequestError('Invalid movie.'));

  if (movie.numberInStock === 0)
    return next(new BadRequestError('Movie not in stock.'));

  const rental = new Rental({
    customer: req.body.customer,
    movie: req.body.movie,
  });

  // two phase commit(Transaction)
  try {
    new Fawn.Task()
      .save('rentals', rental)
      .update(
        'movies',
        { _id: movie._id },
        {
          $inc: { numberInStock: -1 },
        }
      )
      .run();

    res.status(StatusCodes.OK).json({
      status: 'success',
      data: {
        rental,
      },
    });
  } catch (err) {
    return next(new AppError('Something went wrong.'));
  }
});

exports.getAllRentals = factory.getAll(Rental);
exports.getRental = factory.getOne(Rental);
exports.deleteRental = factory.deleteOne(Rental);
