const express = require('express');
const morgan = require('morgan');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const mongoSanitize = require('express-mongo-sanitize');
const xss = require('xss-clean');
const hpp = require('hpp');
const cors = require('cors');
const path = require('path');
const compression = require('compression');
const cookieParser = require('cookie-parser');

// requiring routes
const userRouter = require('../routes/users');
const genreRouter = require('../routes/genres');
const courseRouter = require('../routes/courses');
const customerRouter = require('../routes/customers');
const movieRouter = require('../routes/movies');
const rentalRouter = require('../routes/rental');
const reviewRouter = require('../routes/reviews');
const returnRouter = require('../routes/returns');
const bookingRouter = require('../routes/bookings');

module.exports = (app) => {
  // Global Middlewares
  // implement CORS
  app.use(cors());

  // Access-Control-Allow-Origin
  app.options('*', cors());

  // serving static files
  app.use(express.static(path.join(`${__dirname}../public`)));

  // set security HTTP headers
  app.use(helmet());

  // development logging
  if (app.get('env') === 'development') {
    app.use(morgan('dev'));
  }

  // limit request from same API
  const limiter = rateLimit({
    max: 100,
    windowMs: 60 * 60 * 1000, // 1 Hour
    message: 'Too many request from this IP, Please try again in an hour.',
  });

  app.use('/api', limiter);

  // body Parser, reading data from body into req.body
  app.use(express.json({ limit: '10kb' }));
  app.use(express.urlencoded({ extended: true, limit: '10kb' }));

  // cookie parser middleware
  app.use(cookieParser());

  // data sanitization against NoSQL query injection
  app.use(mongoSanitize());

  // data sanitization against XSS
  app.use(xss());

  // prevent parameter pollution
  app.use(
    hpp({
      whitelist: [
        'name',
        'price',
        'title',
        'ratingsAverage',
        'ratingsQuantity',
        'numberInStock',
        'dailyRentalRate',
      ],
    })
  );

  // compression middleware
  app.use(compression());

  // test middleware
  app.use((req, res, next) => {
    req.requestTime = new Date().toISOString();
    // console.log(req.headers);

    next();
  });

  // routes
  app.use('/api/v1/users', userRouter);
  app.use('/api/v1/genres', genreRouter);
  app.use('/api/v1/courses', courseRouter);
  app.use('/api/v1/customers', customerRouter);
  app.use('/api/v1/movies', movieRouter);
  app.use('/api/v1/rentals', rentalRouter);
  app.use('/api/v1/reviews', reviewRouter);
  app.use('/api/v1/returns', returnRouter);
  app.use('/api/v1/bookings', bookingRouter);
};
