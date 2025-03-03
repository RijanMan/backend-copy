import Order from "../models/order.js";
import { successResponse, errorResponse } from "../utils/responseHandler.js";
import Restaurant from "../models/Restaurant.js";

export const createOrder = async (req, res) => {
  try {
    const { restaurantId, items, totalAmount, paymentMethod, deliveryAddress } =
      req.body;

    const restaurant = await Restaurant.findById(restaurantId);
    if (!restaurant) {
      return errorResponse(res, "Restaurant not found", 404);
    }

    const order = new Order({
      user: req.user._id,
      restaurant: restaurantId,
      items,
      totalAmount,
      paymentMethod,
      deliveryAddress,
    });

    await order.save();
    successResponse(res, order, "Order created successfully", 201);
  } catch (error) {
    errorResponse(res, error.message, 400);
  }
};

export const getUserOrders = async (req, res) => {
  try {
    const orders = await Order.find({ user: req.user._id }).sort({
      createdAt: -1,
    });
    successResponse(res, orders, "Orders retrieved successfully");
  } catch (error) {
    errorResponse(res, error.message, 400);
  }
};

export const getRestaurantOrders = async (req, res) => {
  try {
    const { restaurantId } = req.params;

    const restaurant = await Restaurant.findById(restaurantId);
    if (!restaurant) {
      return errorResponse(res, "Restaurant not found", 404);
    }

    if (restaurant.owner.toString() !== req.user._id.toString()) {
      return errorResponse(
        res,
        "Not authorized to view orders for this restaurant",
        403
      );
    }

    const orders = await Order.find({
      restaurant: req.params.restaurantId,
    }).sort({ createdAt: -1 });
    successResponse(res, orders, "Orders retrieved successfully");
  } catch (error) {
    errorResponse(res, error.message, 400);
  }
};

export const updateOrderStatus = async (req, res) => {
  try {
    const { orderId } = req.params;
    const { status } = req.body;

    const order = await Order.findById(orderId);
    if (!order) {
      return errorResponse(res, "Order not found", 404);
    }

    const restaurant = await Restaurant.findById(order.restaurant);
    if (restaurant.owner.toString() !== req.user._id.toString()) {
      return errorResponse(
        res,
        "Not authorized to update status for this order",
        403
      );
    }

    order.status = status;
    await order.save();
    successResponse(res, order, "Order status updated successfully");
  } catch (error) {
    errorResponse(res, error.message, 400);
  }
};
