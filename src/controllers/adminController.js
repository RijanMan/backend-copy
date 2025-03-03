import User from "../models/User.js";
import Restaurant from "../models/Restaurant.js";
import Order from "../models/Order.js";
import { successResponse, errorResponse } from "../utils/responseHandler.js";

export const getSystemAnalytics = async (req, res) => {
  try {
    const totalUsers = await User.countDocuments();
    const totalRestaurants = await Restaurant.countDocuments();
    const totalOrders = await Order.countDocuments();

    const recentOrders = await Order.find()
      .sort({ createdAt: -1 })
      .limit(10)
      .populate("user", "name")
      .populate("restaurant", "name");

    const totalRevenue = await Order.aggregate([
      { $group: { _id: null, total: { $sum: "$totalAmount" } } },
    ]);

    const analytics = {
      totalUsers,
      totalRestaurants,
      totalOrders,
      recentOrders,
      totalRevenue: totalRevenue[0]?.total || 0,
    };

    successResponse(res, analytics, "System analytics retrieved successfully");
  } catch (error) {
    errorResponse(res, error.message, 400);
  }
};

export const getAllUsers = async (req, res) => {
  try {
    const users = await User.find().select("-password");
    successResponse(res, users, "All users retrieved successfully");
  } catch (error) {
    errorResponse(res, error.message, 400);
  }
};

export const updateUserStatus = async (req, res) => {
  try {
    const { userId } = req.params;
    const { status } = req.body;

    const user = await User.findById(userId);
    if (!user) {
      return errorResponse(res, "User not found", 404);
    }

    user.isActive = status;
    await user.save();

    successResponse(res, user, "User status updated successfully");
  } catch (error) {
    errorResponse(res, error.message, 400);
  }
};

export const getAllRestaurants = async (req, res) => {
  try {
    const restaurants = await Restaurant.find().populate("owner", "name email");
    successResponse(res, restaurants, "All restaurants retrieved successfully");
  } catch (error) {
    errorResponse(res, error.message, 400);
  }
};

export const updateRestaurantStatus = async (req, res) => {
  try {
    const { restaurantId } = req.params;
    const { status } = req.body;

    const restaurant = await Restaurant.findById(restaurantId);
    if (!restaurant) {
      return errorResponse(res, "Restaurant not found", 404);
    }

    restaurant.isActive = status;
    await restaurant.save();

    successResponse(res, restaurant, "Restaurant status updated successfully");
  } catch (error) {
    errorResponse(res, error.message, 400);
  }
};
