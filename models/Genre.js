const mongoose = require('mongoose');
const slugify = require('slugify');
const Joi = require('joi');

const genreSchema = new mongoose.Schema({
    name: {
        type: String,
        required: [true, 'A genre must have a name'],
        unique: true,
        minlength: [5, 'A genre name must have more or equal than 5 characters'],
        maxlength: [50, 'A genre name must have less or equal than 50 characters']
    },
    slug: {
        type: String,
        lowercase: true,
        unique: true
    },
    createdAt: {
        type: Date,
        default: Date.now(),
        select: false
    }
});

// Improving read performance with index
genreSchema.index({ name: 1 });

genreSchema.pre('save', function(next) {
    this.slug = slugify(this.name, { lower: true });

    next();
});

const Genre = mongoose.model('Genre', genreSchema);

function validateGenre(genre) {
    const schema = Joi.object({
        name: Joi.string().min(5).max(50).required().label('Name')
    });

    return schema.validate(genre);
}

module.exports = {
    Genre,
    validateGenre
};