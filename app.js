const express = require('express');

// requiring routes
const NotFoundError = require('./errors/notFound');
const globalErrorHandler = require('./errors');

// start express app
const app = express();

console.log(app.get('env'));

require('./startup/routes')(app);

app.all('*', (req, res, next) => {
  next(new NotFoundError(`Can't find ${req.originalUrl} on this server`));
});

app.use(globalErrorHandler);

module.exports = app;
