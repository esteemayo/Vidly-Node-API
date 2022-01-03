const mongoose = require('mongoose');
const dotenv = require('dotenv');
const config = require('config');
require('colors');

dotenv.config({ path: './config.env' });

// Database local
const dbLocal = process.env.DATABASE_LOCAL;

const db = config.get('db');

module.exports = () => {
  // MongoDB connection
  mongoose
    .connect(db, {
      useNewUrlParser: true,
      useCreateIndex: true,
      useUnifiedTopology: true,
      useFindAndModify: false,
    })
    .then(() => console.log(`Connected to Database → ${db}`.gray.bold));
};
