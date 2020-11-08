const mongoose = require('mongoose');
const slugify = require('slugify');
const Joi = require('joi');

const courseSchema = new mongoose.Schema({
    name: {
        type: String,
        required: [true, 'A course must have a name.'],
        unique: true,
        minlength: [5, 'A course name must have more or equal than 5 characters.'],
        maxlength: [255, 'A course name must have less or equal than 255 characters.']
    },
    category: {
        type: String,
        required: [true, 'A course must belong to a category.'],
        enum: ['web', 'mobile', 'network'],
        lowercase: true,
        trim: true
    },
    slug: String,
    author: String,
    tags: {
        type: Array,
        isAsync: true,
        validate: {
            validator: function(el) {
                return el && el.length > 0;
            },
            message: 'A course should have at least one tag!'
        }
    },
    isPublished: Boolean,
    price: {
        type: Number,
        required: function() {
            return this.isPublished;
        },
        min: [10, 'Price must be above 10.'],
        max: [200, 'Price must be below 0.'],
        // get: val => Math.round(val),
        set: val => Math.round(val)
    },
    createdAt: {
        type: Date,
        default: Date.now(),
        select: false
    }
});

// Improving read performance with index(Compund index)
courseSchema.index({ price: 1, slug: 1 });

courseSchema.pre('save', function(next) {
    this.slug = slugify(this.name, { lower: true });
    next();
});

const Course = mongoose.model('Course', courseSchema);

function validateCourse(course) {
    const schema = Joi.object({
        name: Joi.string().min(5).max(255).required().label('Name'),
        category: Joi.string().lowercase().trim().required().label('Category'),
        author: Joi.string().label('Author'),
        tags: Joi.array().required().label('Tags'),
        isPublished: Joi.boolean(),
        price: Joi.number().min(10).max(200).required().label('Price')
    });

    return schema.validate(course);
}

module.exports = {
    Course,
    validateCourse
}