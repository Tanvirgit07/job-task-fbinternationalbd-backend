const express = require('express');
const { createUser, loginUser } = require('../controllers/userController');
const userRouter = express.Router();


userRouter.post('/register',createUser)
userRouter.post('/login',loginUser);

module.exports = {
    userRouter
}