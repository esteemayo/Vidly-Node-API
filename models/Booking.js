const mongoose = require('mongoose');

const bookingSchema = new mongoose.Schema({
  movie: {
    type: mongoose.Types.ObjectId,
    ref: 'Movie',
    required: [true, 'Booking must belong to a movie'],
  },
  customer: {
    type: mongoose.Types.ObjectId,
    ref: 'Customer',
    required: [true, 'Booking must belong to a customer'],
  },
  paid: {
    type: Boolean,
    default: true,
  },
  createdAt: {
    type: Date,
    default: Date.now(),
    select: false,
  },
});

bookingSchema.pre(/^find/, function (next) {
  this.populate({
    path: 'movie',
    select: '-genre -numberInStock -slug -__v',
  }).populate({
    path: 'customer',
    select: 'name isGold phone',
  });

  next();
});

const Booking = mongoose.model('Booking', bookingSchema);

module.exports = Booking;
