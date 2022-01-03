const { StatusCodes } = require('http-status-codes');

const Movie = require('../models/Movie');
const Rental = require('../models/Rental');
const catchAsync = require('../utils/catchAsync');
const { Customer } = require('../models/Customer');
const BadRequestError = require('../errors/badRequest');

exports.returnMovie = catchAsync(async (req, res, next) => {
  const customer = await Customer.findById(req.body.customer);
  if (!customer) return next(new BadRequestError('customerId not provided.'));

  const movie = await Movie.findById(req.body.movie);
  if (!movie) return next(new BadRequestError('movieId not provided.'));

  const rental = await Rental.lookup(customer, movie);

  if (!rental) return next(new BadRequestError('Rental not found.'));

  if (rental.dateReturned)
    return next(new BadRequestError('Return already processed.'));

  rental.return();

  await rental.save();

  await Movie.update(
    { _id: rental.movie._id },
    {
      $inc: { numberInStock: 1 },
    }
  );

  return res.status(StatusCodes.OK).json({
    status: 'success',
    data: {
      rental,
    },
  });
});
