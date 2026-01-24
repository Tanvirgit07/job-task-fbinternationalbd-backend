const express = require('express');
const cors = require('cors');
const { userRouter } = require('./routes/userRouter');

const app = express();


app.use(cors());
app.use(express.json());


app.use("/auth", userRouter);

app.get("/", (req, res) => {
  res.send("ORS Tracker API is running 🚗");
});



app.use((err, req, res, next) => {
  const statusCode = err.statusCode || 500;
  const message = err.message || "Internal Server Error !";
  res.status(statusCode).json({
    success: false,
    statusCode,
    message,
  });
});


module.exports = {app};