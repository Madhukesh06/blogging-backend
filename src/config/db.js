const mongoose = require("mongoose");
require("dotenv").config();

const URL = process.env.URL;

const connect = () => {
  return mongoose.connect(URL);
};
module.exports = connect;
