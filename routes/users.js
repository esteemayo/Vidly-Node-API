const express = require('express');

const authController = require('../controllers/authController');
const userController = require('../controllers/userController');
const imageController = require('../controllers/imageController');
const validateObjectId = require('../middlewares/validateObjectId');

const router = express.Router();

router.post(
  '/signup',
  imageController.upload,
  imageController.resizeNewUserPhoto,
  authController.signup
);

router.post('/login', authController.login);

router.post('/forgotPassword', authController.forgotPassword);

router.post('/resetPassword/:token', authController.resetPassword);

router.use(authController.protect);

router.patch('/updateMyPassword', authController.updatePassword);

router.get('/me', userController.getMe, userController.getUser);

router.patch(
  '/updateMe',
  imageController.upload,
  imageController.resizeUserPhoto,
  userController.updateMe
);

router.delete('/deleteMe', userController.deleteMe);

router
  .route('/')
  .get(userController.getAllUsers)
  .post(userController.createUser);

router
  .route('/:id')
  .get(validateObjectId, userController.getUser)
  .patch(validateObjectId, userController.updateUser)
  .delete(validateObjectId, userController.deleteUser);

module.exports = router;
