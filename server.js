require('colors');

process.on('uncaughtException', (err) => {
  console.log('UNCAUGHT EXCEPTION! 🔥 Shutting down gracefully...'.red.bold);
  console.log(err.name, err.message);
  process.exit(1);
});

const app = require('./app');

// mongoDB connection
require('./startup/db')();

app.set('port', process.env.PORT || 9009);

const server = app.listen(app.get('port'), () =>
  console.log(`Listening on port ${server.address().port}...`.blue.bold)
);

process.on('unhandledRejection', (err) => {
  console.log('UNHANDLED REJECTION! 🔥 Shutting down gracefully...'.red.bold);
  console.log(err.name, err.message);
  server.close(() => {
    process.exit(1);
  });
});

module.exports = server;
