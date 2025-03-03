import User from "../models/User.js";
import { successResponse, errorResponse } from "../utils/responseHandler.js";

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

    switch (user.role?.toLowerCase()) {
      case "admin":
        profileData = {
          ...profileData,
          adminDepartment: user.adminDepartment,
          adminAccessLevel: user.adminAccessLevel,
        };
        break;
      case "vendor":
        profileData = {
          ...profileData,
          RestaurantName: user.RestaurantName,
          RestaurantDetail: user.ownedRestaurants,
        };
        break;
      case "rider":
        profileData = {
          ...profileData,
          licenseNumber: user.licenseNumber,
        };
        break;
      case "user":
        profileData = {
          ...profileData,
          Preferences: user.preferences,
        };
        break;
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
    if (req.body.password) {
      user.password = req.body.password;
    }
    user.address = req.body.address || user.address;
    user.phoneNumber = req.body.phoneNumber || user.phoneNumber;

    if (req.file) {
      user.profilePicture = `/uploads/profiles/${req.file.filename}`;
    }

    switch (user.role) {
      case "admin":
        user.adminDepartment = req.body.adminDepartment || user.adminDepartment;
        user.adminAccessLevel =
          req.body.adminAccessLevel || user.adminAccessLevel;
        break;
      case "vendor":
        user.RestaurantName = req.body.RestaurantName || user.RestaurantName;
        break;
      case "rider":
        user.licenseNumber = req.body.licenseNumber || user.licenseNumber;
        break;
      case "user":
        user.preferences = req.body.preferences || user.preferences;
        break;
    }

    const updatedUser = await user.save();
    successResponse(res, updatedUser, "User profile updated successfully");
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

export const updateUserPreferences = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    if (!user) {
      return errorResponse(res, "User not found", 404);
    }

    const { dietaryRestrictions, favoriteCuisines, spicyPreference } = req.body;

    if (dietaryRestrictions) {
      user.preferences.dietaryRestrictions = dietaryRestrictions;
    }
    if (favoriteCuisines) {
      user.preferences.favoriteCuisines = favoriteCuisines;
    }
    if (spicyPreference !== undefined) {
      user.preferences.spicyPreference = spicyPreference;
    }

    await user.save();
    successResponse(
      res,
      user.preferences,
      "User preferences updated successfully"
    );
  } catch (error) {
    errorResponse(res, error.message, 500);
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

export const getUserPreferences = async (req, res) => {
  try {
    const user = await User.findById(req.user._id).populate(
      "preferences.favoriteRestaurants"
    );
    if (!user) {
      return errorResponse(res, "User not found", 404);
    }

    successResponse(
      res,
      user.preferences,
      "User preferences retrieved successfully"
    );
  } catch (error) {
    errorResponse(res, error.message, 500);
  }
};
