const mongoose = require('mongoose');
const moment = require('moment');

const rentalSchema = new mongoose.Schema({
  customer: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Customer',
    required: [true, 'Rental must belong to a customer.'],
  },
  movie: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Movie',
    required: [true, 'Rental must belong to a movie.'],
  },
  dateOut: {
    type: Date,
    required: true,
    default: Date.now(),
  },
  dateReturned: Date,
  rentalFee: {
    type: Number,
    min: [0, 'Rental fee must be above 0.'],
  },
});

// Preventing duplicate rental
rentalSchema.index({ customer: 1, movie: 1 }, { unique: true });

rentalSchema.pre(/^find/, function (next) {
  this.populate({
    path: 'customer',
    select: 'name isGold phone',
  }).populate({
    path: 'movie',
    select: '-genre -numberInStock -slug -__v',
  });

  next();
});

rentalSchema.statics.lookup = function (customer, movie) {
  return this.findOne({
    customer: customer,
    movie: movie,
  });
};

rentalSchema.methods.return = function () {
  this.dateReturned = new Date();

  const rentalDays = moment().diff(this.dateOut, 'days');

  this.rentalFee = rentalDays * this.movie.dailyRentalRate;
};

const Rental = mongoose.model('Rental', rentalSchema);

module.exports = Rental;
