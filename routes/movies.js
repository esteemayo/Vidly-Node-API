const express = require('express');
const authController = require('../controllers/authController');
const movieController = require('../controllers/movieController');
const imageController = require('../controllers/imageController');
const validateObjectId = require('../middlewares/validateObjectId');
const reviewRouter = require('./reviews');

const router = express.Router();

// Nested routes
router.use('/:movieId/reviews', reviewRouter);

router
    .route('/top-5-movies')
    .get(
        movieController.topMovies,
        movieController.getAllMovies
    );

router.use(authController.protect);

router
    .route('/')
    .get(movieController.getAllMovies)
    .post(
        imageController.upload,
        imageController.resizeMoviePhoto,
        movieController.createMovie
    );

router
    .route('/:id')
    .get(
        validateObjectId,
        movieController.getMovie
    )
    .patch(
        validateObjectId,
        imageController.upload,
        imageController.resizeMoviePhoto,
        movieController.updateMovie
    )
    .delete(
        validateObjectId,
        // authController.restrictTo('admin'),
        movieController.deleteMovie
    );

module.exports = router;