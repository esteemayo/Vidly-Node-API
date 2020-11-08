const express = require('express');
const authController = require('../controllers/authController');
const genreController = require('../controllers/genreController');
const validateObjectId = require('../middlewares/validateObjectId');
const validate = require('../middlewares/validate');
const { validateGenre } = require('../models/Genre');

const router = express.Router();

router.use(authController.protect);

router
    .route('/')
    .get(
        genreController.getAllGenres
    )
    .post(
        validate(validateGenre),
        genreController.createGenre
    );

router
    .route('/:id')
    .get(
        validateObjectId,
        genreController.getGenre
    )
    .patch(
        validate(validateGenre),
        validateObjectId,
        genreController.updateGenre
    )
    .delete(
        validateObjectId,
        genreController.deleteGenre
    );

module.exports = router;