const handleError = require("../config/handelError");
const User = require("../models/user");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");

const createUser = async (req, res, next) => {
  try {
    const { username, email, password, role } = req.body;

    // 1️⃣ Validate input
    if (!username) {
      return res.status(400).json({
        success: false,
        message: "Username is required",
      });
    }

    if (!email) {
      return res.status(400).json({
        success: false,
        message: "Email is required",
      });
    }

    if (!password) {
      return res.status(400).json({
        success: false,
        message: "Password is required",
      });
    }

    // 2️⃣ Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(409).json({
        success: false,
        message: "A user with this email already exists",
      });
    }

    // 3️⃣ Hash the password
    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(password, saltRounds);

    // 4️⃣ Create new user
    const newUser = await User.create({
      username,
      email,
      password: hashedPassword,
      role, // optional, default is 'viewer'
    });

    // 5️⃣ Send response (without password)
    const { password: pw, ...userData } = newUser.toObject();

    res.status(201).json({
      success: true,
      message: `User '${username}' created successfully`,
      data: userData,
    });
  } catch (err) {
    next(handleError(500, err.message)); // centralized error handler handle করবে
  }
};

const loginUser = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    // 1️⃣ Validate input
    if (!email)
      return res.status(400).json({ success: false, message: "Email is required" });
    if (!password)
      return res.status(400).json({ success: false, message: "Password is required" });

    // 2️⃣ Check if user exists
    const user = await User.findOne({ email });
    if (!user)
      return res.status(401).json({ success: false, message: "Invalid email or password" });

    // 3️⃣ Compare password
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch)
      return res.status(401).json({ success: false, message: "Invalid email or password" });

    // 4️⃣ Generate Tokens
    const payload = { id: user._id, role: user.role };

    // Short-lived Access Token
    const accessToken = jwt.sign(payload, process.env.JWT_SECRET, {
      expiresIn: "15m", // 15 minutes
    });

    // Long-lived Refresh Token
    const refreshToken = jwt.sign({ id: user._id }, process.env.REFRESH_TOKEN_SECRET, {
      expiresIn: "7d", // 7 days
    });

    // 5️⃣ Send user data (without password)
    const userData = {
      id: user._id,
      username: user.username,
      email: user.email,
      role: user.role,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    };

    res.status(200).json({
      success: true,
      message: "Login successful",
      accessToken,
      refreshToken, // <-- added
      user: userData,
    });
  } catch (err) {
    next(err); // centralized error handler
  }
};


module.exports = {
  createUser,
  loginUser,
};
