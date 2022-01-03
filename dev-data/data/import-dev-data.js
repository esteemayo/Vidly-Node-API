const fs = require('fs');
require('colors');

// models
const User = require('../../models/User');
const Movie = require('../../models/Movie');
const Review = require('../../models/Review');
const Rental = require('../../models/Rental');
const Booking = require('../../models/Booking');
const { Genre } = require('../../models/Genre');
const { Course } = require('../../models/Course');
const { Customer } = require('../../models/Customer');

// mongoDB connection
require('../../startup/db')();

// read JSON file
const movies = JSON.parse(fs.readFileSync(`${__dirname}/movies.json`, 'utf-8'));
const genres = JSON.parse(fs.readFileSync(`${__dirname}/genres.json`, 'utf-8'));
const users = JSON.parse(fs.readFileSync(`${__dirname}/users.json`, 'utf-8'));
const reviews = JSON.parse(
  fs.readFileSync(`${__dirname}/reviews.json`, 'utf-8')
);
const courses = JSON.parse(
  fs.readFileSync(`${__dirname}/courses.json`, 'utf-8')
);
const customers = JSON.parse(
  fs.readFileSync(`${__dirname}/customers.json`, 'utf-8')
);

// import data into DB
const importData = async () => {
  try {
    await Movie.create(movies);
    await Genre.create(genres);
    await Review.create(reviews);
    await Course.create(courses);
    await Customer.create(customers);
    await User.create(users, { validateBeforeSave: false });

    console.log('Data successfully loaded.'.green.bold);
    process.exit();
  } catch (err) {
    console.log(err);
    process.exit();
  }
};

// delete all data from DB
const deleteData = async () => {
  try {
    await Movie.deleteMany();
    await Genre.deleteMany();
    await Review.deleteMany();
    await Rental.deleteMany();
    await Course.deleteMany();
    await Customer.deleteMany();
    await User.deleteMany();
    await Booking.deleteMany();

    console.log('Data successfully deleted.'.green.bold);
    process.exit();
  } catch (err) {
    console.log(err);
    process.exit();
  }
};

if (process.argv[2] === '--import') {
  importData();
} else if (process.argv[2] === '--delete') {
  deleteData();
}

// console.log(process.argv);
