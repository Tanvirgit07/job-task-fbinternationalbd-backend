const express = require('express');
const { createUser, loginUser, forgotPassword, verifyOtp, resetPassword } = require('../controllers/authController');
const authRouter = express.Router();


authRouter.post("/register", createUser);
authRouter.post("/login", loginUser);
authRouter.post("/forgot-password", forgotPassword);
authRouter.post("/verify-otp", verifyOtp);
authRouter.post("/reset-password", resetPassword);

module.exports = {
    authRouter
}