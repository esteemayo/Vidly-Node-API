const _ = require('lodash');
const factory = require('./handlerFactory');
const catchAsync = require('../utils/catchAsync');
const AppError = require('../utils/appError');
const User = require('../models/User');

exports.updateMe = catchAsync(async (req, res, next) => {
    if (req.body.password || req.body.passwordConfirm) {
        return next(new AppError(`This route is not for password updates. Please use ${req.protocol}://${req.get('host')}/api/v1/users/updateMyPassword`, 400));
    }

    /**
     * 
     const filterBody = _.pick(req.body, ['name', 'email', 'username', 'dateOfBirth', 'bio', 'phone', 'address', 'streetAddress', 'city', 'state', 'zipCode']);
 
     const user = await User.findByIdAndUpdate(req.user.id, filterBody, {
         new: true,
         runValidators: true
     });
     */

     let photo;
     if (req.file) photo = req.file.filename;

     const { firstName, lastName, email, username, phone, dateOfBirth, streetAddress, city, state, zipCode, bio } = req.body;
    
    const user = await User.findByIdAndUpdate(req.user.id, { 
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
                zipCode
            }
        ]
     }, {
        new: true,
        runValidators: true
    });

    // Send response
    res.status(200).json({
        status: 'success',
        data: {
            user
        }
    });
});

exports.getMe = (req, res, next) => {
    req.params.id = req.user.id;
    
    next();
}

exports.deleteMe = catchAsync(async (req, res, next) => {
    await User.findByIdAndUpdate(req.user.id, { active: false });

    // Send response
    res.status(204).json({
        status: 'success',
        data: null
    });
});

exports.createUser = (req, res, next) => {
    res.status(500).json({
        status: 'fail',
        message: `This route is not defined! Please use ${req.protocol}://${req.get('host')}/api/v2/users/signup instead`
    });
}

exports.getAllUsers = factory.getAll(User);
exports.getUser = factory.getOne(User);
// Do NOT update or delete password with this!
exports.updateUser = factory.updateOne(User);
exports.deleteUser = factory.deleteOne(User);