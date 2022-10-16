const express = require("express");
const cors = require("cors");
const dbConnect = require("./config/db");
const userRouter = require("./models/user.router");
require("dotenv").config();

const PORT = process.env.PORT || 8080;
const app = express();

app.use(express.urlencoded({ extended: true }));

app.use(express.json());

app.use(cors());
app.use("/users", userRouter);
app.listen(PORT, async () => {
  await dbConnect();
  console.log("Server running on PORT : http://localhost:8080");
});
