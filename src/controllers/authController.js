const handleError = require("../config/handelError");
const sendMail = require("../config/sendMailer");
const User = require("../models/user");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");

/* ================= REGISTER ================= */
const createUser = async (req, res, next) => {
  try {
    const { username, email, password, role } = req.body;

    if (!username || !email || !password) {
      return res.status(400).json({
        success: false,
        message: "Username, email and password are required",
      });
    }

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(409).json({
        success: false,
        message: "A user with this email already exists",
      });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const newUser = await User.create({
      username,
      email,
      password: hashedPassword,
      role,
    });

    const { password: pw, ...userData } = newUser.toObject();

    res.status(201).json({
      success: true,
      message: "User created successfully",
      data: userData,
    });
  } catch (err) {
    next(handleError(500, err.message));
  }
};

/* ================= LOGIN ================= */
const loginUser = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: "Email and password are required",
      });
    }

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(401).json({
        success: false,
        message: "Invalid email or password",
      });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: "Invalid email or password",
      });
    }

    const accessToken = jwt.sign(
      { id: user._id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: "15m" },
    );

    const refreshToken = jwt.sign(
      { id: user._id },
      process.env.REFRESH_TOKEN_SECRET,
      { expiresIn: "7d" },
    );

    res.status(200).json({
      success: true,
      message: "Login successful",
      accessToken,
      refreshToken,
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        role: user.role,
      },
    });
  } catch (err) {
    next(handleError(500, err.message));
  }
};

const forgotPassword = async (req, res, next) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ success: false, message: "Email is required" });
    }

    const user = await User.findOne({ email });
    
    if (!user) {
      // Security: same response even if user not found
      return res.status(200).json({
        success: true,
        message: "If that email exists, a password reset link has been sent!",
      });
    }

    // 🔐 Generate JWT token (15 min expiry)
    const resetToken = jwt.sign(
      { id: user._id },
      process.env.JWT_SECRET,  // use a separate secret if you want
      { expiresIn: "15m" }
    );

    // Save token + expiry in user model (optional)
    user.resetToken = resetToken;
    user.resetTokenExpire = Date.now() + 15 * 60 * 1000; // 15 min
    await user.save({ validateBeforeSave: false });

    // 🔗 Create reset link
    const resetLink = `${process.env.FRONTEND_URL}/reset-password?token=${resetToken}`;

    // Send Email
    await sendMail({
      to: email,
      subject: "Password Reset Link",
      text: `Click this link to reset your password: ${resetLink}`,
      html: `<p>Click <a href="${resetLink}">here</a> to reset your password. This link will expire in 15 minutes.</p>`,
    });

    res.status(200).json({
      success: true,
      message: "Password reset link sent successfully!",
    });

  } catch (err) {
    next(handleError(500, err.message));
  }
};
/* ================= VERIFY OTP ================= */
const verifyOtp = async (req, res, next) => {
  try {
    const { email, otp } = req.body;

    if (!email || !otp) {
      return res.status(400).json({
        success: false,
        message: "Email and OTP are required",
      });
    }

    const user = await User.findOne({ email });
    if (!user || !user.resetOtpExpire) {
      return res.status(400).json({
        success: false,
        message: "Invalid OTP or email",
      });
    }

    if (user.resetOtpExpire < Date.now()) {
      return res.status(400).json({
        success: false,
        message: "OTP expired",
      });
    }

    const isOtpValid = await bcrypt.compare(otp, user.resetOtpHash);
    if (!isOtpValid) {
      return res.status(400).json({
        success: false,
        message: "Invalid OTP",
      });
    }

    user.isResetOtpVerified = true;
    await user.save({ validateBeforeSave: false });

    res.status(200).json({
      success: true,
      message: "OTP verified successfully",
    });
  } catch (err) {
    next(handleError(500, err.message));
  }
};

const resetPassword = async (req, res, next) => {
  try {
    const { token, newPassword } = req.body;

    if (!token || !newPassword) {
      return res.status(400).json({
        success: false,
        message: "Token and new password are required",
      });
    }

    // JWT verify
    let decoded;
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET);
    } catch (err) {
      return res.status(400).json({
        success: false,
        message: "Invalid or expired token",
      });
    }

    // Find user by ID
    const user = await User.findById(decoded.id);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    // Update password
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    user.password = hashedPassword;
    await user.save();

    res.status(200).json({
      success: true,
      message: "Password reset successful!",
    });
  } catch (err) {
    next(handleError(500, err.message));
  }
};


module.exports = {
  createUser,
  loginUser,
  forgotPassword,
  verifyOtp,
  resetPassword,
};
