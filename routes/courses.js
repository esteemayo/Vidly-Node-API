const express = require('express');

const validate = require('../middlewares/validate');
const { validateCourse } = require('../models/Course');
const authController = require('../controllers/authController');
const courseController = require('../controllers/courseController');
const validateObjectId = require('../middlewares/validateObjectId');

const router = express.Router();

router.use(authController.protect);

router
  .route('/')
  .get(courseController.getAllCourses)
  .post(validate(validateCourse), courseController.createCourse);

router
  .route('/:id')
  .get(validateObjectId, courseController.getCourse)
  .patch(
    validateObjectId,
    validate(validateCourse),
    courseController.updateCourse
  )
  .delete(validateObjectId, courseController.deleteCourse);

module.exports = router;
