const express = require("express");
require('dotenv').config();
require('./database/DbConnection');
const userRouter = require('./routes/Routes');
const app = express();
app.use(express.json());
app.use(userRouter);
const port = process.env.PORT || 5000;