const mongoose = require('mongoose');
const slugify = require('slugify');

const movieSchema = new mongoose.Schema({
    title: {
        type: String,
        required: [true, 'A movie should have a name.'],
        trim: true,
        minlength: [5, 'A movie title must have more or equal than 5 characters.'],
        maxlength: [255, 'A movie title must have less or equal than 5 characters.']
    },
    genre: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Genre',
        required: [true, 'A movie must have a genre.']
    },
    numberInStock: {
        type: Number,
        required: [true, 'Number in stock must be specified.'],
        min: [0, 'Number in stock must be above 0'],
        max: [255, 'Number in stock must be below 255']
    },
    dailyRentalRate: {
        type: Number,
        required: [true, 'A daily rental rate field is required.'],
        min: [0, 'Daily rental rate must be above 0'],
        max: [255, 'Daily rental rate must be below 255']
    },
    ratingsAverage: {
        type: Number,
        default: 4.5,
        min: [1, 'Rating must be above 1.0'],
        max: [5, 'Rating must be below 5.0'],
        get: val => Math.round(val * 10) / 10,
        set: val => Math.round(val * 10) / 10
    },
    ratingsQuantity: {
        type: Number,
        default: 0
    },
    photo: {
        type: String,
        default: 'movie.jpg'
    },
    slug: {
        type: String,
        lowercase: true
    },
    createdAt: {
        type: Date,
        default: Date.now(),
        select: false
    }
}, {
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
});

// Improving read performance with index
movieSchema.index({ ratingsQuantity: 1, ratingsAverage: 1 });   // Compound index
movieSchema.index({ slug: 1 });

// Virtual populate reviews
movieSchema.virtual('reviews', {
    ref: 'Review',
    foreignField: 'movie',
    localField: '_id'
});

movieSchema.pre('save', function (next) {
    this.slug = slugify(this.title, { lower: true });
    next();
});

movieSchema.pre(/^find/, function (next) {
    this.populate({
        path: 'genre',
        select: '_id name'
    });

    next();
});

const Movie = mongoose.model('Movie', movieSchema);

module.exports = Movie;