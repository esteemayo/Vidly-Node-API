const { StatusCodes } = require('http-status-codes');

module.exports = (validate) => {
  return (req, res, next) => {
    const { error } = validate(req.body);
    if (error)
      return res.status(StatusCodes.BAD_REQUEST).send(error.details[0].message);

    next();
  };
};
