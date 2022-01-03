const { StatusCodes } = require('http-status-codes');

const catchAsync = require('../utils/catchAsync');
const APIFeatures = require('../utils/apiFeatures');
const NotFoundError = require('../errors/notFound');

exports.getAll = (Model) =>
  catchAsync(async (req, res, next) => {
    // to allow for nested GET reviews on product & blog (hack)
    let filter = {};
    if (req.params.movieId) filter = { movie: req.params.movieId };

    // execute query
    const features = new APIFeatures(Model.find(filter), req.query)
      .filter()
      .sort()
      .limitFields()
      .paginate();

    // const docs = await features.query.explain();
    const docs = await features.query;

    // send response
    res.status(StatusCodes.OK).json({
      status: 'success',
      requestedAt: req.requestTime,
      results: docs.length,
      data: {
        docs,
      },
    });
  });

exports.getOne = (Model, popOptions) =>
  catchAsync(async (req, res, next) => {
    const { id: docID } = req.params;

    let query = Model.findById(docID);
    if (popOptions) query = query.populate(popOptions);

    const doc = await query;

    if (!doc) {
      return next(
        new NotFoundError(`No document was found with the given ID : ${docID}`)
      );
    }

    res.status(StatusCodes.OK).json({
      status: 'success',
      data: {
        doc,
      },
    });
  });

exports.createOne = (Model) =>
  catchAsync(async (req, res, next) => {
    let data = req.body;
    if (req.file) data.photo = req.file.filename;

    const doc = await Model.create(data);

    res.status(StatusCodes.CREATED).json({
      status: 'success',
      data: {
        doc,
      },
    });
  });

exports.updateOne = (Model) =>
  catchAsync(async (req, res, next) => {
    const { id: docID } = req.params;

    let data = req.body;
    if (req.file) data.photo = req.file.filename;

    const doc = await Model.findByIdAndUpdate(docID, data, {
      new: true,
      runValidators: true,
    });

    if (!doc) {
      return next(
        new NotFoundError(`No was document found with the given ID : ${docID}`)
      );
    }

    res.status(StatusCodes.OK).json({
      status: 'success',
      data: {
        doc,
      },
    });
  });

exports.deleteOne = (Model) =>
  catchAsync(async (req, res, next) => {
    const { id: docID } = req.params;

    const doc = await Model.findByIdAndDelete(docID);

    if (!doc) {
      return next(
        new NotFoundError(`No was document found with the given ID : ${docID}`)
      );
    }

    res.status(StatusCodes.NO_CONTENT).json({
      status: 'success',
      data: null,
    });
  });
