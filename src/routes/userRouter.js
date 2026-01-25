const express = require('express');
const { getAllUsers, getSingleUser, deleteUser } = require('../controllers/userController');
const userRouter = express.Router();


userRouter.get("/getAllUser", getAllUsers);
userRouter.get("/getUserById/:id", getSingleUser);
userRouter.delete("/deleteUser/:id", deleteUser);

module.exports = {
    userRouter
}