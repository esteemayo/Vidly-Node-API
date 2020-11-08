process.on('uncaughtException', err => {
    console.log('UNCAUGHT EXCEPTION! 🔥 Shutting down gracefully...');
    console.log(err.name, err.message);
    process.exit(1);
});

const app = require('./app');

// MongoDB connection
require('./startup/db')();

const PORT = process.env.PORT || 9009;

const server = app.listen(PORT, () => console.log(`Listening on port ${PORT}...`));

process.on('unhandledRejection', err => {
    console.log('UNHANDLED REJECTION! 🔥 Shutting down gracefully...');
    console.log(err.name, err.message);
    server.close(() => {
        process.exit(1);
    });
});

module.exports = server;