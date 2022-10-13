const mongoose = require("mongoose");

const userSchema = new mongoose.Schema({
  userName: String,
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  age: Number,
});

const User = mongoose.model("user", userSchema);

module.exports = User;
