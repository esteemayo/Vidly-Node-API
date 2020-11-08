const multer = require('multer');
const sharp = require('sharp');
const catchAsync = require('../utils/catchAsync');
const AppError = require('../utils/appError');

/**
 const multerStorage = multer.diskStorage({
     destination: (req, file, cb) => {
         cb(null, 'public/img/users');
     },
     filename: (req, file, cb) => {
         const ext = file.mimetype.split('/')[1];
         cb(null, `user-${Date.now()}.${ext}`);
     }
 });
 */

const multerStorage = multer.memoryStorage();

const multerFilter = (req, file, cb) => {
    if (file.mimetype.startsWith('image')) {
        return cb(null, true);
    }
    return cb(new AppError('Not an image! Please upload only images', 400), false);
}

const upload = multer({
    storage: multerStorage,
    fileFilter: multerFilter
});

exports.upload = upload.single('photo');

exports.resizeNewUserPhoto = catchAsync(async (req, res, next) => {
    if (!req.file) return next();

    req.file.filename = `users-${Date.now()}.jpeg`;

    await sharp(req.file.buffer)
        .resize(500, 500)
        .toFormat('jpeg')
        .jpeg({ quality: 90 })
        .toFile(`public/img/users/${req.file.filename}`);

    next();
});

exports.resizeUserPhoto = catchAsync(async (req, res, next) => {
    if (!req.file) return next();

    req.file.filename = `users-${req.user.id}-${Date.now()}.jpeg`;

    await sharp(req.file.buffer)
        .resize(500, 500)
        .toFormat('jpeg')
        .jpeg({ quality: 90 })
        .toFile(`public/img/user/${req.file.filename}`);

    next();
});

exports.resizeMoviePhoto = catchAsync(async (req, res, next) => {
    if (!req.file) return next();

    const id = req.params.id ? req.params.id : 'new';

    req.file.filename = `movies-${id}-${Date.now()}.jpeg`;

    await sharp(req.file.buffer)
        .resize(2000, 1333)
        .toFormat('jpeg')
        .jpeg({ quality: 90 })
        .toFile(`public/img/movies/${req.file.filename }`);

    next();
});