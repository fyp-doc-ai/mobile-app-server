require('dotenv').config()
require('../middlewares/Passport');
require('../database/db');

const express = require("express");
const serverless = require("serverless-http");
const bodyParser = require('body-parser');
const cors = require("cors");
const authRouter = require('../routes/auth');
const userRouter = require('../routes/api/user');
const cookieParser = require("cookie-parser");
const app = express();
const port = process.env.PORT;
const passport = require('passport');
const router = express.Router();

// const origin = "http://localhost:3000/"
// app.use(
//     cors({
//       origin: ["http://localhost:3000/"],
//       methods: ["GET", "POST"],
//       credentials: true,
//     })
//   );

// ngrok http http://localhost:8080

app.use(bodyParser.urlencoded({extended: true}));
app.use(cors());
app.use(cookieParser());
app.use(express.json());

router.use('/auth', authRouter);
router.use('/api', passport.authenticate('jwt', {session: false}), userRouter);  
router.get('/test', (req, res) => {
    res.json({ success: true, message: 'Welcome to backend zone!',items:"No Items" });
});

app.listen(port, () => {
    console.log(`Listening on port ${port}`)
});

app.use('/.netlify/functions/server', router);
module.exports.handler = serverless(app);
