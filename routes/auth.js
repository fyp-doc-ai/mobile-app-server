const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const passport = require('passport');
const User = require("../models/userModel");
const {userSignUp, userLogin, passwordReset, newLinkForPassword, googleLogin} = require('../controllers/authController');
const { passportLogin } = require('../middlewares/Passport');

router.post('/login', passportLogin ,userLogin);
router.post('/signup', userSignUp, passportLogin, userLogin);
router.post('/googleLogin', googleLogin);
router.post('/request-reset-password', newLinkForPassword);
router.post('/reset-password', passwordReset);

module.exports = router;