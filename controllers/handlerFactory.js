const AppError = require('../utils/appError');
const catchAsync = require('../utils/catchAsync');
const APIFeatures = require('../utils/apiFeatures');

exports.getAll = Model => catchAsync(async (req, res, next) => {
    // To allow for nested GET reviews on product & blog (hack)
    let filter = {};
    if (req.params.movieId) filter = { movie: req.params.movieId };

    // Execute query
    const features = new APIFeatures(Model.find(filter), req.query)
        .filter()
        .sort()
        .limitFields()
        .paginate();

    // const docs = await features.query.explain();
    const docs = await features.query;

    // Send response
    res.status(200).json({
        status: 'success',
        requestedAt: req.requestTime,
        results: docs.length,
        data: {
            docs
        }
    });
});

exports.getOne = (Model, popOptions) => catchAsync(async (req, res, next) => {
    let query = Model.findById(req.params.id);
    if (popOptions) query = query.populate(popOptions);
    
    const doc = await query;

    if (!doc) {
        return next(new AppError('No document was found with the given ID.', 404));
    }

    res.status(200).json({
        status: 'success',
        data: {
            doc
        }
    });
});

exports.createOne = Model => catchAsync(async (req, res, next) => {
    let data = req.body;
    if (req.file) data.photo = req.file.filename;

    const doc = await Model.create(data);

    res.status(201).json({
        status: 'success',
        data: {
            doc
        }
    });
});

exports.updateOne = Model => catchAsync(async (req, res, next) => {
    let data = req.body;
    if (req.file) data.photo = req.file.filename;

    const doc = await Model.findByIdAndUpdate(req.params.id, data, {
        new: true,
        runValidators: true
    });

    if (!doc) {
        return next(new AppError('No was document found with the given ID.', 404));
    }

    res.status(200).json({
        status: 'success',
        data: {
            doc
        }
    });
});

exports.deleteOne = Model => catchAsync(async (req, res, next) => {
    const doc = await Model.findByIdAndDelete(req.params.id);

    if (!doc) {
        return next(new AppError('No was document found with the given ID.', 404));
    }

    res.status(204).json({
        status: 'success',
        data: null
    });
});