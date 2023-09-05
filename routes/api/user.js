const express = require('express');
const router = express.Router();
const {sendMail} = require('../../controllers/contactController');
const {upgradeUser} = require('../../controllers/userController');
const {userLogout} = require('../../controllers/authController');

router.post('/contact', sendMail);
router.post('/upgrade-plan', upgradeUser);
router.post('/logout', userLogout);

module.exports = router;