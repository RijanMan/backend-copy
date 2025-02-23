import User from "../models/User.js";
import { successResponse, errorResponse } from "../utils/responseHandler.js";

// Get user profile
export const getUserProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select("-password");
    if (!user) {
      return errorResponse(res, "User not found", 404);
    }
    successResponse(res, user, "User profile retrieved successfully");
  } catch (error) {
    return errorResponse(res, "Server error", 500);
  }
};

// Update user profile
export const updateUserProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    if (!user) {
      return errorResponse(res, "User not found", 404);
    }

    user.name = req.body.name || user.name;
    user.email = req.body.email || user.email;
    if (req.body.password) {
      user.password = req.body.password;
    }
    user.address = req.body.address || user.address;
    user.phoneNumber = req.body.phoneNumber || user.phoneNumber;

    if (req.file) {
      user.profilePicture = `/uploads/profiles/${req.file.filename}`;
    }

    const updatedUser = await user.save();
    successResponse(
      res,
      {
        _id: updatedUser._id,
        name: updatedUser.name,
        email: updatedUser.email,
        role: updatedUser.role,
        address: updatedUser.address,
        phoneNumber: updatedUser.phoneNumber,
        profilePicture: updatedUser.profilePicture,
      },
      "User profile updated successfully"
    );
  } catch (error) {
    return errorResponse(res, "Server error", 500);
  }
};

// Get all users
export const getAllUsers = async (req, res) => {
  try {
    const user = await User.find({}).select("-password");
    successResponse(res, user, "All users retrieved successfully");
  } catch (error) {
    return errorResponse(res, "Server error", 500);
  }
};

// Get user by ID
export const getUserById = async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select("-password");
    if (!user) {
      return errorResponse(res, "User not found", 404);
    }
    successResponse(res, user, "User retrieved successfully");
  } catch (error) {
    return errorResponse(res, "Server error", 500);
  }
};

// Delete user
export const deleteUser = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) {
      return errorResponse(res, "User not found", 404);
    }
    await user.remove();
    successResponse(res, {}, "User deleted successfully");
  } catch (error) {
    return errorResponse(res, "Server error", 500);
  }
};
