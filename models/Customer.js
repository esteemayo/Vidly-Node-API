const mongoose = require('mongoose');
const Joi = require('joi');

const customerSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'A customer must have a name'],
    maxlength: [
      255,
      'A customer name must have less or equal than 255 characters',
    ],
    minlength: [3, 'A customer name must have more or equal than 3 characters'],
  },
  phone: {
    type: String,
    required: [true, 'A customer must provide a phone number.'],
    maxlength: [
      255,
      'A customer name must have less or equal than 255 characters',
    ],
    minlength: [5, 'A customer name must have more or equal than 5 characters'],
  },
  isGold: {
    type: Boolean,
    default: false,
  },
  createdAt: {
    type: Date,
    default: Date.now(),
    select: false,
  },
});

const Customer = mongoose.model('Customer', customerSchema);

function validateCustomer(customer) {
  const schema = Joi.object({
    name: Joi.string().max(255).min(3).required().label('Name'),
    phone: Joi.string().max(255).min(5).required().label('Phone'),
    isGold: Joi.boolean(),
  });

  return schema.validate(customer);
}

module.exports = {
  Customer,
  validateCustomer,
};
