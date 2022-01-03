const mongoose = require('mongoose');
const { StatusCodes } = require('http-status-codes');

module.exports = (req, res, next) => {
  if (!mongoose.Types.ObjectId.isValid(req.params.id))
    return res.status(StatusCodes.NOT_FOUND).send('Invalid ID.');

  next();
};
