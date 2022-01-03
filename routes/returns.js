const express = require('express');

const authController = require('../controllers/authController');
const returnController = require('../controllers/returnController');

const router = express.Router();

router.route('/').post(authController.protect, returnController.returnMovie);

module.exports = router;
