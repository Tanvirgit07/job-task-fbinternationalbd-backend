const express = require('express');
const cors = require('cors');

const app = express();


app.use(cors());
app.use(express.json());



app.get("/", (req, res) => {
  res.send("ORS Tracker API is running 🚗");
});



app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({
    success: false,
    message: "Something went wrong",
  });
});


module.exports = {app};