const mongoose = require('mongoose');
const Movie = require('./Movie');
const Joi = require('joi');

const reviewSchema = new mongoose.Schema({
    review: {
        type: String,
        required: [true, 'Review cannot be empty.']
    },
    rating: {
        type: Number,
        min: [1, 'Rating must not be below 1.0'],
        max: [5, 'Rating must not be above 5.0']
    },
    movie: {
        type: mongoose.Types.ObjectId,
        ref: 'Movie',
        required: [true, 'Review must belong to a movie.']
    },
    user: {
        type: mongoose.Types.ObjectId,
        ref: 'User',
        required: [true, 'Review must belong to a user.']
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

// Preventing duplicate review
reviewSchema.index({ movie: 1, user: 1 }, { unique: 1 });

// Query Middleware
reviewSchema.pre(/^find/, function (next) {
    this.populate({
        path: 'user',
        select: 'name email photo'
    });

    next();
});

// Calculating average ratings on movie
reviewSchema.statics.calculateAverageRatings = async function (movieId) {
    const stats = await this.aggregate([
        {
            $match: { movie: movieId }
        },
        {
            $group: {
                _id: '$movie',
                nRating: { $sum: 1 },
                avgRating: { $avg: '$rating' }
            }
        }
    ]);

    // Persist the data(nRating and avgRating) into movieSchema or movie in general
    if (stats.length > 0) {
        await Movie.findByIdAndUpdate(movieId, {
            ratingsQuantity: stats[0].nRating,
            ratingsAverage: stats[0].avgRating
        });
    } else {
        await Movie.findByIdAndUpdate(movieId, {
            ratingsQuantity: 0,
            ratingsAverage: 4.5
        });
    }
}

reviewSchema.post('save', function () {
    this.constructor.calculateAverageRatings(this.movie);
});

// Updating and deleting review/rating
reviewSchema.pre(/^findOneAnd/, async function (next) {
    this.r = await this.findOne();

    next();
});

reviewSchema.post(/^findOneAnd/, async function () {
    await this.r.constructor.calculateAverageRatings(this.r.movie);
});

const Review = mongoose.model('Review', reviewSchema);

function validateReview(review) {
    const schema = Joi.object({
        review: Joi.string().required().label('Review'),
        rating: Joi.number().min(1).max(5).label('Rating'),
        movie: Joi.string().required().label('Movie'),
        user: Joi.string().required().label('User')
    });

    return schema.validate(review);
}

module.exports = {
    Review,
    validateReview
};