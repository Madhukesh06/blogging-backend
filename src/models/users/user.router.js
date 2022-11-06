const express = require("express");
const User = require("./user.modal");
const jwt = require("jsonwebtoken");
require("dotenv").config();

const MAINKEY = process.env.MAINKEY;
const REFKEY = process.env.REFKEY;
const mainExpiresIn = process.env.mainExpiresIn;
const refreshExpiresIn = process.env.refreshExpiresIn;

const nodeMailer = require("nodemailer");

const transport = nodeMailer.createTransport({
  host: "smtp.ethereal.email",
  port: 587,
  auth: {
    user: "timmothy.greenholt@ethereal.email",
    pass: "CbGznH6A1NmZzpzVvd",
  },
});

const app = express.Router();

app.get("/", (req, res) => {
  res.send("hello world!");
});

app.get("/gitauth", (req, res) => {
  res.send(
    '<a href="https://github.com/login/oauth/authorize?client_id=3a9e877831326ff986d7">Test</a>'
  );
});

app.post("/signup", async (req, res) => {
  const { email, password } = req.body;
  let existUser = await User.findOne({ email });
  if (existUser) return res.status(401).send("User already exists");
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

//button - refresh token if expired

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

// Verify token - create new token and  send token to user
const Blacklist = [];
app.post("/verify", async (req, res) => {
  const token = req.body.token;
  console.log(token);

  try {
    const verify = jwt.verify(token, "GOLDENTOKEN");
    res.send({ message: "Token is valid go ahead and work" });
  } catch (e) {
    Blacklist.push(token);
    var data = jwt.decode(token);
    delete data["iat"];
    delete data["exp"];
    const newToken = jwt.sign(data, "GOLDENTOKEN", { expiresIn: "5 mins" });
    res.send({
      ErrorMessage: "Token has been expired ! Created a new Token",
      token: newToken,
    });
  }
});

// Get-OTP
const otps = { email: "" };
app.post("/reset-password/getotp", async (req, res) => {
  const { email } = req.body;
  const otp = Math.floor(Math.random() * 9999);
  otps[email] = otp;

  transport
    .sendMail({
      to: email,
      from: "abc@gmail.com",
      subject: "OTP",
      text: `Hello ${email} ,your OTP is ${otp}`,
    })
    .then(() => {
      console.log("Email sent successfully");
      res.send("Email sent success");
    });
});

app.post("/reset-password/reset", async (req, res) => {
  const { email, newPassword, otp } = req.body;
  console.log(otp, email, newPassword, otps);

  if (otps[email] == otp) {
    delete otps[email];
    await User.findOneAndUpdate(
      { email: email }, // Findby
      { password: newPassword }, // update password
      { new: true } // instant update
    );
    return res.send("New password updated successfully");
  }
  return res.send("Invalid OTP");
});

//Blog API
// ? All Blog API->
// app.get("/blogs", async (req, res) => {
//   let data = await BlogModel.find({})
//   res.send(data)
// })

// app.get("/blogs/:id", async (req, res) => {
//   // var title = req.params.title.replace("-", " ")
//   var id = req.params.id
//   let data = await BlogModel.findOne({_id: id})

//   res.send(data)
// })

module.exports = app;
