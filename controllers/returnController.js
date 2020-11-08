const Movie = require('../models/Movie');
const Rental = require('../models/Rental');
const { Customer } = require('../models/Customer');
const catchAsync = require('../utils/catchAsync');
const AppError = require('../utils/appError');

exports.returnMovie = catchAsync(async (req, res, next) => {
    const customer = await Customer.findById(req.body.customer);
    if (!customer) return next(new AppError('customerId not provided.', 400));
    
    const movie = await Movie.findById(req.body.movie);
    if (!movie) return next(new AppError('movieId not provided.', 400));

    const rental = await Rental.lookup(customer, movie);

    if (!rental) return next(new AppError('Rental not found.', 404));
    
    if (rental.dateReturned) return next(new AppError('Return already processed.', 400));

    rental.return();
    
    await rental.save();

    await Movie.update({ _id: rental.movie._id }, {
        $inc : { numberInStock: 1 }
    });

    return res.status(200).json({
        status: 'success',
        data: {
            rental
        }
    });
});