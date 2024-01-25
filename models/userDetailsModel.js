const mongoose = require("mongoose");

const userDetailsSchema = new mongoose.Schema({
    userId: {
        type: String,
        required: [true, "userId is Required"],
    },
    fullName: {
        type: String,
        required: [true, "fullName is Required"],
    },
    email: {
        type: String,
        unique: true, // `email` must be unique
        required: [true, "email is Required"],
    },
    dateOfBirth: {
        type: String,
        required: [false, "DateOfBirth is not required"],
    },
    profileUri: {
        type: String,
        required: [false, "profileUri is not required"],
    },
});

userDetailsSchema.plugin(require('mongoose-beautiful-unique-validation'));

module.exports = mongoose.model("userDetails", userDetailsSchema);