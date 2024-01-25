const passport = require('passport');
const passportJWT = require('passport-jwt');
const ExtractJWT = passportJWT.ExtractJwt;
const JWTStrategy   = passportJWT.Strategy;
const LocalStrategy = require('passport-local').Strategy;
const User = require("../models/userModel");
const bcrypt = require("bcryptjs");
const jwt = require('jsonwebtoken');

passport.use(new LocalStrategy(
  {
    usernameField: 'email',
    passwordField: 'password',
    passReqToCallback: true
  },
  async function(request, email, password, done) {
    const lowerCaseEmail = email.toLowerCase();
    const user = await User.findOne({email:lowerCaseEmail});
    if(!user){
      const error = {message: 'Email does not exist'}
      return done(error, null, {message: 'Logged In failed.'});
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if(!isMatch){
      const error = {message: 'Password is incorrect'}
      return done(error, null, {message: 'Logged In failed.'});
    }
    const passportUser = {
      id: user._id,
      email: user.email,
      role: user.role,
      roleExpire: user.roleExpire,
      roleInit: user.roleInit,
    }

    return done(null, passportUser, {message: 'Logged In Successful.'});
  }
));

passport.use(new JWTStrategy(
  {
    jwtFromRequest: ExtractJWT.fromAuthHeaderAsBearerToken(),
    secretOrKey: process.env.ACCESS_TOKEN_SECRET,
    passReqToCallback: true
  }, 
  async function (request, jwtPayload, done) {  
    // let dbKey = await common.getDBKeyFromRequest(request);
    // const User = dbRepo[dbKey].User;
    // User.findByPk(jwtPayload.id)
    const user = await User.findById(jwtPayload.id);
    const headerToken = ExtractJWT.fromAuthHeaderAsBearerToken()(request);
    if (!user || user.tokenDetails.token !== headerToken) {
      // Use the done function to indicate authentication failure
      return done(null, false, { message: "Your session has expired" });
    }

    const passportUser = {
      role: user.role,
      id: user._id,
      email: user.email,
      roleExpire: user.roleExpire,
      roleInit: user.roleInit,
    }
    request.body.user = passportUser;
    return done(null, passportUser);
  }
));

function passportLogin(req, res, next) {
  passport.authenticate('local', {session: false}, (err, user, info) => {
      if (err || !user) {
          const message = err ? err?.message ? err.message : err : info?.message;
          return res.status(400).json({
              message: message,
              user   : user
          });
      }
      req.login(user, {session: false}, (err) => {
          if (err) {
              res.send(err);
          }
          const token = jwt.sign(user, process.env.ACCESS_TOKEN_SECRET,{ expiresIn: '1d' });
          // const fakeToken = getJwt;
          // return res.json({user, token});
          req.body.user = user;
          req.body.token = token;
          next();
      });
  })(req, res);
}

module.exports = {
  passportLogin
}