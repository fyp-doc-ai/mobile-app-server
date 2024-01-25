require('dotenv').config()
const User = require("../models/userModel");
const UserDetails = require("../models/userDetailsModel");
const validate = require('../utils/validation');
const bcrypt = require('bcryptjs');
const emailjs = require('@emailjs/nodejs');
const jwt = require('jsonwebtoken');
const axios = require('axios');

async function sendEmail(emailParams) {
    try {
      const response = await emailjs.send(process.env.EMAILJS_SERVICE_ID, process.env.EMAILJS_TEMPLATE_ID, emailParams, {
        publicKey: process.env.EMAILJS_PUBLIC_KEY,
        privateKey: process.env.EMAILJS_PRIVATE_KEY, // optional, highly recommended for security reasons
      });
      console.log('SUCCESS!', response.status, response.text);
      const status = response.status;
      const message = response.text;
      return {status, message};
    } catch (err) {
      console.log('FAILED...', err);
      const status = err.status;
      const message = err.text;
      return {status, message};
    }
  }

const userLogin = async (req, res) => {
    const { token, user } = req.body;

    const tokenDetails = { token: token, logged_at: new Date() }
    let UserRole = user.role;
    const currentDate = new Date();
    const initDate = new Date(user.roleInit);  
    const expireDate = new Date(user.roleExpire);  

    if(UserRole==="PREMIUM_USER" && currentDate>expireDate){
        UserRole = "NORMAL_USER"
    }

    const updateUser = await User.updateOne(
      { _id: user.id },
      { $set: { "tokenDetails": tokenDetails, "role":UserRole } },
      { expireAfterSeconds: 86400, upsert: true }
    );

    if(updateUser.acknowledged){
        console.log('user login success')
        return res.status(200).json({ token });
    }else{
        return res.status(400).json({ success: false, message: 'Internal server error'})
    }
}

const userSignUp = async (req, res) => {
    const { fullName, email, password } = req.body;
    //validation
    const result = validate.register_validation({ fullName, email, password });
    if (result?.error) {
        return res.status(400).json({
            success: false,
            message: result.error.details
        });
    }

    const hashedPwd = await bcrypt.hash(password, 10);
    // const newUser = await User.create({ fName, lName, email, password:hashedPwd });

    try {
        const role1 = "NORMAL_USER"
        const role2 = "PREMIUM_USER"
        const newUser = await User.create({ email, password:hashedPwd, role:role1});
        await UserDetails.create({ 
          userId: newUser._id,
          fullName: fullName,
          email:email, 
        });
        
        // Forward the request to the login endpoint
        const loginEndPoint = process.env.SERVER_DOMAIN + "auth/login"
        const response = await axios.post(loginEndPoint, {
            email: email,
            password: password
        });
        const token = response.data.token;
        console.log('user signup success')
        return res.status(200).json({ token });

      } catch (error) {
        console.log('error',error)
        return res.status(400).json({ success: false, message: 'User email is already exist'})
      }
}

const googleLogin = async (req, res) => {
  const { email, fullName } = req.body;

  const role1 = "NORMAL_USER"
  const role2 = "PREMIUM_USER"
  const DBUser = await User.findOne({email:email});
  if(!DBUser){
    const newUser = await User.create({ fullName, email, role:role1});
    const user = {
      role: role1,
      id: newUser._id,
      fullName: fullName,
      email: email,
      roleExpire: null,
      roleInit: null,
    }
    const token = jwt.sign(user, process.env.ACCESS_TOKEN_SECRET,{ expiresIn: '1d' });
    req.body.user = user;
    req.body.token = token;
    userLogin(req, res);
  }else{
    const user = {
      role: DBUser.role,
      id: DBUser._id,
      fullName: DBUser.fullName,
      email: DBUser.email,
      roleExpire: DBUser?.roleExpire,
      roleInit: DBUser?.roleInit,
    }
    const token = jwt.sign(user, process.env.ACCESS_TOKEN_SECRET,{ expiresIn: '1d' });
    req.body.user = user;
    req.body.token = token;
    userLogin(req, res);
  }
}

const newLinkForPassword = async (req, res) => {
    const { email } = req.body;
    const result = validate.emailVerify({ email });
    if (result?.error) {
        return res.status(400).json({
            success: false,
            message: result.error.details
        });
    }
    const user = await User.findOne({email:email});
    if(!user){
      return res.status(400).json({ success: false, message: 'Email does not exist'})
    }

    const tokenDetails = {
        verified:true,
        userId : user._id,
        email: user.email
    } 
    const token = jwt.sign(tokenDetails, process.env.ACCESS_TOKEN_SECRET,{ expiresIn: '1d' });
    const passwordResetUrl = process.env.DOMAIN_NAME+"PasswordReset/"+`${token}`;
    const emailParams = {passwordResetUrl:passwordResetUrl, email:email, userName:user.fullName}
    
    try {
        const {status, message} = await sendEmail(emailParams);
    
        if (status === 200) {
          return res.status(200).json({ 'success': true, "message": message, 'status':200 });
        } else {
          return res.status(500).json({ 'success': false, "message": message, 'status':400 });
        }
      } catch (error) {
        console.log('Error:', error);
        return res.status(500).json({ 'success': false, "message": "Internal server error", 'status':500 });
      }
}

const passwordReset = async (req, res) => {
    const { confirmPassword, password, email } = req.body;

    //validation
    const result = validate.reset_password_validation({ email, password });
    if (result?.error) {
        return res.status(400).json({
            success: false,
            message: result.error.details
        });
    }

    const user = await User.findOne({email:email});
    if(!user){
      return res.status(400).json({ success: false, message: 'Email does not exist'})
    }

    const hashedPwd = await bcrypt.hash(confirmPassword, 10);
    try {
        const updateUser = await User.updateOne(
            { email: email },
            { $set: { "password": hashedPwd} },
          );
      
          if(updateUser.acknowledged){
              return res.json({ success: true, message: 'Password reset successfully'});
          }else{
              return res.status(400).json({ success: false, message: 'Internal server error'})
          }
      } catch (error) {
        console.log('error',error)
        return res.status(400).json({ success: false, message: 'Internal Server error'})
      }
}

const userLogout = async (req, res) => {
    const { user } = req.body;

    const tokenDetails = { token: "", logged_at: "" }

    const updateUser = await User.updateOne(
      { _id: user.id },
      { $set: { "tokenDetails": tokenDetails } },
    );

    if(updateUser.acknowledged){
        res.status(200).json({
            message: "Logout successfully",
            success: true
        })
    }else{
        return res.status(400).json({ success: false, message: 'Internal server error'})
    }
}

module.exports = {
    userSignUp,
    userLogin,
    userLogout,
    passwordReset,
    newLinkForPassword,
    googleLogin
}