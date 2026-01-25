const User = require("../models/user");
const handleError = require("../config/handelError");

// 1️⃣ Get All Users with Pagination, Search, Filter
const getAllUsers = async (req, res, next) => {
  try {
    // Query params
    let { page = 1, limit = 10, search = "", role } = req.query;
    page = parseInt(page);
    limit = parseInt(limit);

    // Build query object
    const query = {};

    if (search) {
      query.$or = [
        { username: { $regex: search, $options: "i" } },
        { email: { $regex: search, $options: "i" } },
      ];
    }

    if (role) {
      query.role = role;
    }

    // Count total matching documents
    const total = await User.countDocuments(query);

    // Fetch users with pagination
    const users = await User.find(query)
      .select("-password")
      .skip((page - 1) * limit)
      .limit(limit)
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
      data: users,
    });
  } catch (err) {
    next(handleError(500, err.message));
  }
};

// 2️⃣ Get Single User
const getSingleUser = async (req, res, next) => {
  try {
    const { id } = req.params;
    const user = await User.findById(id).select("-password"); // password hide

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    res.status(200).json({
      success: true,
      data: user,
    });
  } catch (err) {
    next(handleError(500, err.message));
  }
};

// 3️⃣ Delete User
const deleteUser = async (req, res, next) => {
  try {
    const { id } = req.params;
    const user = await User.findById(id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    await user.deleteOne();

    res.status(200).json({
      success: true,
      message: "User deleted successfully",
    });
  } catch (err) {
    next(handleError(500, err.message));
  }
};

module.exports = {
  getAllUsers,
  getSingleUser,
  deleteUser,
};
