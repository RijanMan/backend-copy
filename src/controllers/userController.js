import User from "../models/User.js";
import { successResponse, errorResponse } from "../utils/responseHandler.js";
import { filePathToUrl } from "../middlewares/uploadMiddleware.js";

// Get user profile
export const getUserProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select("-password");
    if (!user) {
      return errorResponse(res, "User not found", 404);
    }

    let profileData = {
      _id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      phoneNumber: user.phoneNumber,
      address: user.address,
      profilePicture: user.profilePicture,
    };

    if (user.role === "admin") {
      profileData;
    } else if (user.role === "vendor") {
      profileData.RestaurantName = user.RestaurantName;
      profileData.ownedRestaurants = user.ownedRestaurants;
    } else if (user.role === "rider") {
      profileData.licenseNumber = user.licenseNumber;
    } else if (user.role === "user") {
      profileData.favoriteRestaurants = user.favoriteRestaurants;
    }

    successResponse(res, profileData, "User profile retrieved successfully");
  } catch (error) {
    errorResponse(res, error.message, 500);
  }
};

// Update user profile
export const updateUserProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    if (!user) {
      return errorResponse(res, "User not found", 404);
    }

    // Common Fields
    user.name = req.body.name || user.name;
    user.email = req.body.email || user.email;
    user.phoneNumber = req.body.phoneNumber || user.phoneNumber;

    // Handle address as an object or string
    if (req.body.address) {
      if (typeof req.body.address === "string") {
        try {
          user.address = JSON.parse(req.body.address);
        } catch (e) {
          // If parsing fails, keep the address as is
          console.error("Error parsing address:", e);
        }
      } else {
        user.address = req.body.address;
      }
    }

    if (req.body.password) {
      user.password = req.body.password;
    }

    if (req.file) {
      user.profilePicture = filePathToUrl(req.file.path);
    }

    switch (user.role) {
      case "admin":
        // No action need for admin
        break;
      case "vendor":
        user.RestaurantName = req.body.RestaurantName || user.RestaurantName;
        break;
      case "rider":
        user.licenseNumber = req.body.licenseNumber || user.licenseNumber;
        break;
      case "user":
        if (req.body.favoriteRestaurants) {
          if (typeof req.body.favoriteRestaurants === "string") {
            user.favoriteRestaurants = req.body.favoriteRestaurants
              .split(",")
              .map((item) => item.trim())
              .filter((item) => item);
          } else {
            user.favoriteRestaurants = req.body.favoriteRestaurants;
          }
        }
        break;
    }

    const updatedUser = await user.save();
    const userResponse = updatedUser.toObject();
    delete userResponse.password;

    // Remove sensitive and unnecessary fields
    delete userResponse.resetPasswordToken;
    delete userResponse.resetPasswordExpires;
    delete userResponse.loginHistory;
    delete userResponse.totalEarnings;
    delete userResponse.ratings;
    delete userResponse.ownedRestaurants;

    // Remove unrelated role-specific fields
    // if (userResponse.role !== "admin") {
    //   delete userResponse.adminDepartment;
    //   delete userResponse.adminAccessLevel;
    // }
    if (userResponse.role !== "vendor") {
      delete userResponse.RestaurantName;
      delete userResponse.ownedRestaurants;
      delete userResponse.totalEarnings;
    }
    if (userResponse.role !== "rider") {
      delete userResponse.licenseNumber;
    }
    if (userResponse.role !== "user") {
      delete userResponse.favoriteRestaurants;
    }

    successResponse(res, userResponse, "User profile updated successfully");
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

export const addFavoriteRestaurant = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    if (!user) {
      return errorResponse(res, "User not found", 404);
    }

    const { restaurantId } = req.body;

    if (!user.preferences.favoriteRestaurants.includes(restaurantId)) {
      user.preferences.favoriteRestaurants.push(restaurantId);
      await user.save();
    }

    successResponse(
      res,
      user.preferences.favoriteRestaurants,
      "Favorite restaurant added successfully"
    );
  } catch (error) {
    errorResponse(res, error.message, 500);
  }
};

export const removeFavoriteRestaurant = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    if (!user) {
      return errorResponse(res, "User not found", 404);
    }

    const { restaurantId } = req.params;

    user.preferences.favoriteRestaurants =
      user.preferences.favoriteRestaurants.filter(
        (id) => id.toString() !== restaurantId
      );
    await user.save();

    successResponse(
      res,
      user.preferences.favoriteRestaurants,
      "Favorite restaurant removed successfully"
    );
  } catch (error) {
    errorResponse(res, error.message, 500);
  }
};
