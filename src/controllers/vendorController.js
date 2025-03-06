import Restaurant from "../models/Restaurant.js";
import Order from "../models/Order.js";
import Subscription from "../models/Subscription.js";
import { successResponse, errorResponse } from "../utils/responseHandler.js";

export const getRestaurantAnalytics = async (req, res) => {
  try {
    const { restaurantId } = req.params;
    const { startDate, endDate } = req.query;

    const restaurant = await Restaurant.findById(restaurantId);
    if (
      !restaurant ||
      restaurant.owner.toString() !== req.user._id.toString()
    ) {
      return errorResponse(
        res,
        "Restaurant not found or you're not authorized",
        404
      );
    }

    // Build date range query
    const dateQuery = {};
    if (startDate && endDate) {
      dateQuery.createdAt = {
        $gte: new Date(startDate),
        $lte: new Date(endDate),
      };
    }

    // Get orders data
    const orders = await Order.find({
      restaurant: restaurantId,
      ...dateQuery,
    });

    // Get subscription data
    const subscriptions = await Subscription.find({
      mealPlan: { $in: await getMealPlanIds(restaurantId) },
      ...dateQuery,
    });

    // Calculate basic metrics
    const totalOrders = orders.length;
    const totalSubscriptions = subscriptions.length;
    const totalRevenue =
      orders.reduce((sum, order) => sum + order.totalAmount, 0) +
      subscriptions.reduce((sum, sub) => sum + sub.totalAmount, 0);

    const activeSubscriptions = subscriptions.filter(
      (sub) => sub.status === "active"
    ).length;
    const averageOrderValue =
      totalOrders > 0
        ? orders.reduce((sum, order) => sum + order.totalAmount, 0) /
          totalOrders
        : 0;

    const analytics = {
      totalOrders,
      totalSubscriptions,
      activeSubscriptions,
      totalRevenue,
      averageOrderValue,
      subscriptionRevenue: subscriptions.reduce(
        (sum, sub) => sum + sub.totalAmount,
        0
      ),
      orderRevenue: orders.reduce((sum, order) => sum + order.totalAmount, 0),
    };

    successResponse(
      res,
      analytics,
      "Restaurant analytics retrieved successfully"
    );
  } catch (error) {
    errorResponse(res, error.message, 400);
  }
};

// Helper function to get meal plan IDs for a restaurant
const getMealPlanIds = async (restaurantId) => {
  const { default: MealPlan } = await import("../models/MealPlan.js");
  const mealPlans = await MealPlan.find({ restaurant: restaurantId });
  return mealPlans.map((plan) => plan._id);
};

export const getRestaurantReport = async (req, res) => {
  try {
    const { restaurantId } = req.params;
    const { startDate, endDate } = req.query;

    const restaurant = await Restaurant.findById(restaurantId);
    if (
      !restaurant ||
      restaurant.owner.toString() !== req.user._id.toString()
    ) {
      return errorResponse(
        res,
        "Restaurant not found or you're not authorized",
        404
      );
    }

    // Build date range query
    const dateQuery = {};
    if (startDate && endDate) {
      dateQuery.createdAt = {
        $gte: new Date(startDate),
        $lte: new Date(endDate),
      };
    }

    // Get orders
    const orders = await Order.find({
      restaurant: restaurantId,
      ...dateQuery,
    }).sort({ createdAt: -1 });

    // Get subscriptions
    const subscriptions = await Subscription.find({
      mealPlan: { $in: await getMealPlanIds(restaurantId) },
      ...dateQuery,
    }).sort({ createdAt: -1 });

    const report = {
      restaurantName: restaurant.name,
      period: { startDate, endDate },
      orders: {
        total: orders.length,
        revenue: orders.reduce((sum, order) => sum + order.totalAmount, 0),
        byStatus: {
          pending: orders.filter((order) => order.status === "pending").length,
          preparing: orders.filter((order) => order.status === "preparing")
            .length,
          out_for_delivery: orders.filter(
            (order) => order.status === "on the way"
          ).length,
          delivered: orders.filter((order) => order.status === "delivered")
            .length,
          cancelled: orders.filter((order) => order.status === "cancelled")
            .length,
        },
      },
      subscriptions: {
        total: subscriptions.length,
        revenue: subscriptions.reduce((sum, sub) => sum + sub.totalAmount, 0),
        active: subscriptions.filter((sub) => sub.status === "active").length,
        paused: subscriptions.filter((sub) => sub.status === "paused").length,
        cancelled: subscriptions.filter((sub) => sub.status === "cancelled")
          .length,
      },
    };

    successResponse(res, report, "Restaurant report generated successfully");
  } catch (error) {
    errorResponse(res, error.message, 400);
  }
};
