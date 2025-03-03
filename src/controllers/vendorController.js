import Restaurant from "../models/Restaurant.js";
import Order from "../models/Order.js";
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

    const query = { restaurant: restaurantId };
    if (startDate && endDate) {
      query.createdAt = {
        $gte: new Date(startDate),
        $lte: new Date(endDate),
      };
    }

    const orders = await Order.find(query);

    const totalOrders = orders.length;
    const totalRevenue = orders.reduce(
      (sum, order) => sum + order.totalAmount,
      0
    );
    const averageOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0;

    const itemsSold = {};
    orders.forEach((order) => {
      order.items.forEach((item) => {
        if (itemsSold[item.name]) {
          itemsSold[item.name] += item.quantity;
        } else {
          itemsSold[item.name] = item.quantity;
        }
      });
    });

    const topSellingItems = Object.entries(itemsSold)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([name, quantity]) => ({ name, quantity }));

    const analytics = {
      totalOrders,
      totalRevenue,
      averageOrderValue,
      topSellingItems,
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

    const query = { restaurant: restaurantId };
    if (startDate && endDate) {
      query.createdAt = {
        $gte: new Date(startDate),
        $lte: new Date(endDate),
      };
    }

    const orders = await Order.find(query).sort({ createdAt: -1 });

    const report = {
      restaurantName: restaurant.name,
      period: { startDate, endDate },
      totalOrders: orders.length,
      totalRevenue: orders.reduce((sum, order) => sum + order.totalAmount, 0),
      ordersByStatus: {
        pending: orders.filter((order) => order.status === "pending").length,
        preparing: orders.filter((order) => order.status === "preparing")
          .length,
        out_for_delivery: orders.filter(
          (order) => order.status === "out_for_delivery"
        ).length,
        delivered: orders.filter((order) => order.status === "delivered")
          .length,
        cancelled: orders.filter((order) => order.status === "cancelled")
          .length,
      },
    };

    successResponse(res, report, "Restaurant report generated successfully");
  } catch (error) {
    errorResponse(res, error.message, 400);
  }
};

export const updateRestaurantHours = async (req, res) => {
  try {
    const { restaurantId } = req.params;
    const { openingHours } = req.body;

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

    restaurant.openingHours = openingHours;
    await restaurant.save();

    successResponse(
      res,
      restaurant.openingHours,
      "Restaurant hours updated successfully"
    );
  } catch (error) {
    errorResponse(res, error.message, 400);
  }
};
