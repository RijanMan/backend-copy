import Order from "../models/Order.js";
import { successResponse, errorResponse } from "../utils/responseHandler.js";
import Restaurant from "../models/Restaurant.js";

export const createOrder = async (req, res) => {
  try {
    const {
      restaurantId,
      items,
      totalAmount,
      paymentMethod,
      deliveryAddress,
      specialInstructions,
    } = req.body;

    const restaurant = await Restaurant.findById(restaurantId);
    if (!restaurant) {
      return errorResponse(res, "Restaurant not found", 404);
    }

    if (!restaurant.isActive) {
      return errorResponse(
        res,
        "Restaurant is currently not accepting orders",
        400
      );
    }

    const order = new Order({
      user: req.user._id,
      restaurant: restaurantId,
      items,
      totalAmount,
      paymentMethod,
      deliveryAddress,
      specialInstructions,
      status: "pending",
      paymentStatus: "pending",
    });

    await order.save();

    // Create notification for restaurant owner
    try {
      const { default: Notification } = await import(
        "../models/Notification.js"
      );
      const notification = new Notification({
        recipient: restaurant.owner,
        type: "order_update",
        title: "New Order Received",
        message: `You have received a new order #${order._id
          .toString()
          .slice(-6)} worth $${totalAmount}`,
        relatedOrder: order._id,
      });
      await notification.save();
    } catch (notificationError) {
      console.error(
        "Failed to create restaurant notification:",
        notificationError
      );
    }

    // Create notification for user
    try {
      const { default: Notification } = await import(
        "../models/Notification.js"
      );
      const userNotification = new Notification({
        recipient: req.user._id,
        type: "order_update",
        title: "Order Placed Successfully",
        message: `Your order #${order._id
          .toString()
          .slice(
            -6
          )} has been placed successfully and is pending confirmation.`,
        relatedOrder: order._id,
      });
      await userNotification.save();
    } catch (notificationError) {
      console.error("Failed to create user notification:", notificationError);
    }

    // Send order confirmation email
    try {
      const { sendOrderConfirmationEmail } = await import("../utils/mailer.js");
      await sendOrderConfirmationEmail(req.user.email, order, restaurant);
    } catch (emailError) {
      console.error("Failed to send order confirmation email:", emailError);
    }

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
    if (!restaurant) {
      return errorResponse(res, "Restaurant not found", 404);
    }

    if (restaurant.owner.toString() !== req.user._id.toString()) {
      return errorResponse(
        res,
        "Not authorized to update status for this order",
        403
      );
    }

    const validTransitions = {
      pending: ["preparing", "cancelled"],
      preparing: ["on the way", "cancelled"],
      "on the way": ["delivered", "cancelled"],
      delivered: [],
      cancelled: [],
    };

    if (!validTransitions[order.status].includes(status)) {
      return errorResponse(
        res,
        `Cannot change order status from ${order.status} to ${status}`,
        400
      );
    }

    const oldStatus = order.status;
    order.status = status;

    // Add timestamp for status change
    if (status === "delivered") {
      order.actualDeliveryTime = new Date();
    }
    await order.save();

    // Create notification for user
    try {
      const notification = {
        recipient: order.user,
        type: "order_update",
        title: "Order Status Updated",
        message: `Your order #${order._id
          .toString()
          .slice(-6)} has been updated from ${oldStatus} to ${status}`,
        relatedOrder: order._id,
      };

      // Import dynamically to avoid circular dependencies
      const { default: Notification } = await import(
        "../models/Notification.js"
      );
      const newNotification = new Notification(notification);
      await newNotification.save();
    } catch (notificationError) {
      console.error("Failed to create notification:", notificationError);
      // Continue with the response even if notification fails
    }

    successResponse(res, order, "Order status updated successfully");
  } catch (error) {
    errorResponse(res, error.message, 400);
  }
};
