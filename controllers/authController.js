const crypto = require('crypto');
const jwt = require('jsonwebtoken');
const { promisify } = require('util');
const { StatusCodes } = require('http-status-codes');

const User = require('../models/User');
const sendEmail = require('../utils/email');
const AppError = require('../errors/appError');
const catchAsync = require('../utils/catchAsync');
const NotFoundError = require('../errors/notFound');
const ForbiddenError = require('../errors/forbidden');
const BadRequestError = require('../errors/badRequest');
const UnauthenticatedError = require('../errors/unauthenticated');

const sendToken = (id, role) => {
  return jwt.sign({ id, role }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN,
  });
};

const createSendToken = (user, statusCode, res) => {
  const token = sendToken(user._id, user.role);

  const cookieOptions = {
    expires: new Date(
      Date.now() + process.env.JWT_COOKIE_EXPIRES_IN * 24 * 60 * 60 * 1000
    ),
    httpOnly: true,
  };

  if (process.env.NODE_ENV === 'development') cookieOptions.secure = true;

  res.cookie('jwt', token, cookieOptions);

  // remove password from output
  user.password = undefined;

  res.status(statusCode).json({
    status: 'success',
    token,
    data: {
      user,
    },
  });
};

exports.signup = catchAsync(async (req, res, next) => {
  let photo;
  if (req.file) photo = req.file.filename;

  const {
    name,
    email,
    username,
    role,
    phone,
    dateOfBirth,
    gender,
    streetAddress,
    city,
    state,
    zipCode,
    bio,
    password,
    passwordConfirm,
    passwordChangedAt,
  } = req.body;

  const user = await User.create({
    name,
    email,
    username,
    role,
    phone,
    dateOfBirth,
    gender,
    bio,
    photo,
    password,
    passwordConfirm,
    passwordChangedAt,
    address: [
      {
        streetAddress,
        city,
        state,
        zipCode,
      },
    ],
  });

  createSendToken(user, StatusCodes.CREATED, res);
});

exports.login = catchAsync(async (req, res, next) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return next(new BadRequestError('Please provide email and password.'));
  }

  const user = await User.findOne({ email }).select('+password');
  if (!user || !(await user.correctPassword(password, user.password))) {
    return next(new BadRequestError('Incorrect email or password.'));
  }

  createSendToken(user, StatusCodes.OK, res);
});

exports.protect = catchAsync(async (req, res, next) => {
  // getting token and check if it's there
  let token;
  const authHeader = req.headers.authorization;

  if (authHeader && authHeader.startsWith('Bearer')) {
    token = authHeader.split(' ')[1];
  }

  if (!token) {
    return next(
      new UnauthenticatedError(
        'You are not logged in! Please log in to get access.'
      )
    );
  }
  // console.log(token);

  // verification token
  const decoded = await promisify(jwt.verify)(token, process.env.JWT_SECRET);
  // console.log(decoded);

  // check if user still exists
  const currentUser = await User.findById(decoded.id);
  //   if (!currentUser) {
  //     return next(
  //       new UnauthenticatedError(
  //         'The user belonging to this token does no longer exist.'
  //       )
  //     );
  //   }

  // check if user changed password after the token was issued
  //   if (currentUser.changedPasswordAfter(decoded.iat)) {
  //     return next(
  //       new UnauthenticatedError(
  //         'User recently changed password! Please log in again'
  //       )
  //     );
  //   }

  // grant access to protected routes
  req.user = currentUser;

  next();
});

exports.restrictTo = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return next(
        new ForbiddenError('You do not have permission to perform this action.')
      );
    }

    next();
  };
};

exports.forgotPassword = catchAsync(async (req, res, next) => {
  const { email } = req.body;

  // get user based on POSTed email
  const user = await User.findOne({ email });
  if (!user) {
    return next(new NotFoundError('There is no user with email address.'));
  }

  // generate the random reset token
  const resetToken = user.createPasswordResetToken();
  await user.save({ validateBeforeSave: false });

  const resetURL = `${req.protocol}://${req.get(
    'host'
  )}/api/v1/users/resetPassword/${resetToken}`;
  const message = `Forgot your password? Submit a PATCH request with your new password and 
        passwordConfirm to: ${resetURL}.\nIf you didn't forget your password, 
        please ignore this email.`;

  try {
    await sendEmail({
      email: user.email,
      subject: 'Your password reset token (valid for 10 minutes)',
      message,
    });

    res.status(StatusCodes.OK).json({
      status: 'success',
      message: 'Token sent to email',
    });
  } catch (err) {
    user.resetPasswordToken = undefined;
    user.resetPasswordExpires = undefined;
    await user.save({ validateBeforeSave: false });

    return next(
      new AppError('There was an error sending the email. Try again later.')
    );
  }
});

exports.resetPassword = catchAsync(async (req, res, next) => {
  // get user based on the token
  const hashedToken = crypto
    .createHash('sha256')
    .update(req.params.token)
    .digest('hex');

  const user = await User.findOne({
    resetPasswordToken: hashedToken,
    resetPasswordExpires: { $gt: Date.now() },
  });

  // if token has not expired, and there is user, set the new password
  if (!user) {
    return next(new BadRequestError('Token is invalid or has expired.'));
  }

  user.password = req.body.password;
  user.passwordConfirm = req.body.passwordConfirm;
  user.resetPasswordToken = undefined;
  user.resetPasswordExpires = undefined;
  await user.save();

  // update passwordChangedAt property for the user
  // log the user in, send JWT

  createSendToken(user, StatusCodes.OK, res);
});

exports.updatePassword = catchAsync(async (req, res, next) => {
  // get user from collection
  const user = await User.findById(req.user.id).select('+password');

  // check if POSTed current password is correct
  if (
    !user ||
    !(await user.correctPassword(req.body.passwordCurrent, user.password))
  ) {
    return next(new BadRequestError('Your current password is wrong.'));
  }

  // if correct, update password
  user.password = req.body.password;
  user.passwordConfirm = req.body.passwordConfirm;
  await user.save();

  // log user in, send jwt
  createSendToken(user, StatusCodes.OK, res);
});
