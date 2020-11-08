const Fawn = require('fawn');
const mongoose = require('mongoose');
const factory = require('./handlerFactory');
const Movie = require('../models/Movie');
const Rental = require('../models/Rental');
const { Customer } = require('../models/Customer');
const catchAsync = require('../utils/catchAsync');
const AppError = require('../utils/appError');

Fawn.init(mongoose);

exports.createRental = catchAsync(async (req, res, next) => {
    const customer = await Customer.findById(req.body.customer);
    if (!customer) return next(new AppError('Invalid customer.', 400));

    const movie = await Movie.findById(req.body.movie);
    if (!movie) return next(new AppError('Invalid movie.', 400));

    if (movie.numberInStock === 0) return next(new AppError('Movie not in stock.', 400));
    
    const rental = new Rental({ customer: req.body.customer, movie: req.body.movie });

    // Two phase commit(Transaction)
    try {
        new Fawn.Task()
            .save('rentals', rental)
            .update('movies', { _id: movie._id }, {
                $inc: { numberInStock: -1 }
            })
            .run();
            
            res.status(200).json({
                status: 'success',
                data: {
                    rental
                }
            });
    } catch (err) {
        return next(new AppError('Something went wrong.', 500));
    }
});

exports.getAllRentals = factory.getAll(Rental);
exports.getRental = factory.getOne(Rental);
exports.deleteRental = factory.deleteOne(Rental);