const express = require('express');

const validate = require('../middlewares/validate');
const { validateCustomer } = require('../models/Customer');
const authController = require('../controllers/authController');
const validateObjectId = require('../middlewares/validateObjectId');
const customerController = require('../controllers/customerController');

const router = express.Router();

router.use(authController.protect);

router
  .route('/')
  .get(customerController.getAllCustomers)
  .post(validate(validateCustomer), customerController.createCustomer);

router
  .route('/:id')
  .get(validateObjectId, customerController.getCustomer)
  .patch(
    validateObjectId,
    validate(validateCustomer),
    customerController.updateCustomer
  )
  .delete(validateObjectId, customerController.deleteCustomer);

module.exports = router;
