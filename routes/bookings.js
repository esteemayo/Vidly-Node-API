const express = require('express');

const authController = require('../controllers/authController');
const validateObjectId = require('../middlewares/validateObjectId');
const bookingController = require('../controllers/bookingController');

const router = express.Router();

router.use(authController.protect);

router
  .route('/')
  .get(bookingController.getAllBookings)
  .post(bookingController.createBooking);

router
  .route('/:id')
  .get(validateObjectId, bookingController.getBooking)
  .patch(validateObjectId, bookingController.updateBooking)
  .delete(validateObjectId, bookingController.deleteBooking);

module.exports = router;
