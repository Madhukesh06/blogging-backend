const express = require("express");
const User = require("./user.modal");
const jwt = require("jsonwebtoken");
require("dotenv").config();

const MAINKEY = process.env.MAINKEY;
const REFKEY = process.env.REFKEY;
const mainExpiresIn = process.env.mainExpiresIn;
const refreshExpiresIn = process.env.refreshExpiresIn;

const app = express.Router();

app.get("/", (req, res) => {
  res.send("hello world!");
});

app.post("/signup", async (req, res) => {
  const { email, password } = req.body;
  const user = new User({ email, password });
  await user.save();
  res.send(user);
});

app.post("/signin", async (req, res) => {
  const { email } = req.body;
  const user = await User.findOne({ email });

  if (!user) return res.send("wrong Credentitals");
  //Generate JWT
  const mainToken = jwt.sign({ id: user._id, email: user.email }, MAINKEY, {
    expiresIn: mainExpiresIn,
  });

  const refreshToken = jwt.sign({ id: user._id, email: user.email }, REFKEY, {
    expiresIn: refreshExpiresIn,
  });

  res.send({
    message: "Login Successful",
    mainToken: mainToken,
    refreshToken: refreshToken,
  });
});

app.get("/:id", async (req, res) => {
  const { id } = req.params;
  const token = req.headers.authorization;
  if (!token) {
    return res.status(401).send("User is Unauthorized");
  }
  try {
    const verify = jwt.verify(token, KEY);
    const user = await User.findById(id);
    res.send(user);
  } catch (e) {
    res.send(e.message);
  }
});

//button

app.post("/refresh", async (req, res) => {
  const refreshToken = req.headers.authorization;

  try {
    const data = jwt.verify(refreshToken, REFKEY);

    console.log(data);

    const mainToken = jwt.sign(data, MAINKEY, {
      expiresIn: mainExpiresIn,
    });
    console.log(jwt.decode(mainToken));
    res.send({ maintoken: mainToken });
  } catch (e) {
    res.send("refresh token is invalid");
  }
});

module.exports = app;
