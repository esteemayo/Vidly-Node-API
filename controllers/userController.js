const { StatusCodes } = require('http-status-codes');

const User = require('../models/User');
const factory = require('./handlerFactory');
const catchAsync = require('../utils/catchAsync');
const BadRequestError = require('../errors/badRequest');

exports.updateMe = catchAsync(async (req, res, next) => {
  if (req.body.password || req.body.passwordConfirm) {
    return next(
      new BadRequestError(
        `This route is not for password updates. Please use ${
          req.protocol
        }://${req.get('host')}/api/v1/users/updateMyPassword`
      )
    );
  }

  let photo;
  if (req.file) photo = req.file.filename;

  const {
    firstName,
    lastName,
    email,
    username,
    phone,
    dateOfBirth,
    streetAddress,
    city,
    state,
    zipCode,
    bio,
  } = req.body;

  const user = await User.findByIdAndUpdate(
    req.user.id,
    {
      firstName,
      lastName,
      email,
      username,
      photo,
      phone,
      dateOfBirth,
      bio,
      address: [
        {
          streetAddress,
          city,
          state,
          zipCode,
        },
      ],
    },
    {
      new: true,
      runValidators: true,
    }
  );

  // send response
  res.status(StatusCodes.OK).json({
    status: 'success',
    data: {
      user,
    },
  });
});

exports.getMe = (req, res, next) => {
  req.params.id = req.user.id;

  next();
};

exports.deleteMe = catchAsync(async (req, res, next) => {
  await User.findByIdAndUpdate(req.user.id, { active: false });

  // send response
  res.status(StatusCodes.NO_CONTENT).json({
    status: 'success',
    data: null,
  });
});

exports.createUser = (req, res, next) => {
  res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
    status: 'fail',
    message: `This route is not defined! Please use ${req.protocol}://${req.get(
      'host'
    )}/api/v2/users/signup instead`,
  });
};

exports.getAllUsers = factory.getAll(User);
exports.getUser = factory.getOne(User);
// do NOT update or delete password with this!
exports.updateUser = factory.updateOne(User);
exports.deleteUser = factory.deleteOne(User);
