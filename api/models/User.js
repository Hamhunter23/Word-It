const mongoose = require('mongoose');

const UserSchema = new mongoose.Schema({
    username: {type: String, required: true, unique: true},
    password: String,
}, { timestamps: true });

const UserModel = mongoose.model('User', UserSchema);
module.exports = UserModel; // directly exporting the userModel threw an error on the nodemon terminal