const express = require('express');

const validate = require('../middlewares/validate');
const { validateReview } = require('../models/Review');
const authController = require('../controllers/authController');
const reviewController = require('../controllers/reviewController');
const validateObjectId = require('../middlewares/validateObjectId');

const router = express.Router({ mergeParams: true });

router.use(authController.protect);

router.route('/').get(reviewController.getAllReviews).post(
  // authController.restrictTo('user'),
  reviewController.sendMovieUserIds,
  validate(validateReview),
  reviewController.createReview
);

router
  .route('/:id')
  .get(validateObjectId, reviewController.getReview)
  .patch(
    // authController.restrictTo('user'),
    validate(validateReview),
    validateObjectId,
    reviewController.updateReview
  )
  .delete(validateObjectId, reviewController.deleteReview);

module.exports = router;
