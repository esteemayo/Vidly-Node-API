const express = require('express');
const authController = require('../controllers/authController');
const customerController = require('../controllers/customerController');
const { validateCustomer } = require('../models/Customer');
const validate = require('../middlewares/validate');
const validateObjectId = require('../middlewares/validateObjectId');

const router = express.Router();

router.use(authController.protect);

router
    .route('/')
    .get(customerController.getAllCustomers)
    .post(
        validate(validateCustomer),
        customerController.createCustomer
    );

router
    .route('/:id')
    .get(
        validateObjectId,
        customerController.getCustomer
    )
    .patch(
        validateObjectId,
        validate(validateCustomer),
        customerController.updateCustomer
    )
    .delete(
        validateObjectId,
        customerController.deleteCustomer
    );

module.exports = router;