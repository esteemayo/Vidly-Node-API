const express = require('express');

const authController = require('../controllers/authController');
const rentalController = require('../controllers/rentalController');
const validateObjectId = require('../middlewares/validateObjectId');

const router = express.Router();

router.use(authController.protect);

router.route('/').get(rentalController.getAllRentals).post(
  // authController.restrictTo('user'),
  rentalController.createRental
);

router.route('/:id').get(validateObjectId, rentalController.getRental).delete(
  // authController.restrictTo('admin'),
  validateObjectId,
  rentalController.deleteRental
);

module.exports = router;
