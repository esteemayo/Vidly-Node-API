const express = require('express');

// Routes
const AppError = require('./utils/appError');
const globalErrorHandler = require('./controllers/errorController');

// Start express app
const app = express();

console.log(app.get('env'));

require('./startup/routes')(app);

app.all('*', (req, res, next) => {
    return next(new AppError(`Can't find ${req.originalUrl} on this server`, 404));
});

app.use(globalErrorHandler);

module.exports = app;