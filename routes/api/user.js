const express = require('express');
const router = express.Router();
const {sendMail} = require('../../controllers/contactController');
const {upgradeUser,editProfile,getUserDetails} = require('../../controllers/userController');
const {userLogout} = require('../../controllers/authController');

router.post('/contact', sendMail);
router.post('/upgrade-plan', upgradeUser);
router.post('/edit-profile', editProfile);
router.get('/get-user-details', getUserDetails);
router.post('/logout', userLogout);

module.exports = router;