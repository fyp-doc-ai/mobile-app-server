const mongoose = require("mongoose");

const userSchema = new mongoose.Schema({
    email: {
        type: String,
        unique: true, // `email` must be unique
        required: [true, "email is Required"],
    },
    password: {
        type: String,
        required: [true, "password is Required"],
    },
    role: {
        type: String,
        required: [true, "role is Required"],
    },
    tokenDetails: {
        type: {token:String, logged_at:String},
        required: [false, "tokenDetails is not Required"],
    },
    roleExpire: {
        type: String,
        required: [false, "roleExpire is not Required"],
    },
    roleInit: {
        type: String,
        required: [false, "roleInit is not Required"],
    }
});

userSchema.plugin(require('mongoose-beautiful-unique-validation'));

module.exports = mongoose.model("users", userSchema);