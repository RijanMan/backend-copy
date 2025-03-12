import Order from "../models/Order.js";
import Restaurant from "../models/Restaurant.js";
import Menu from "../models/Menu.js";
import User from "../models/User.js";
import Subscription from "../models/Subscription.js";
import Notification from "../models/Notification.js";
import { successResponse, errorResponse } from "../utils/responseHandler.js";
import {
  sendOrderConfirmationEmail,
  sendRestaurantOrderNotificationEmail,
} from "../utils/mailer.js";
import { sendOrderStatusUpdate } from "../services/socketService.js";

export const createOrder = async (req, res) => {
  try {
    const {
      restaurantId,
      items,
      deliveryAddress,
      paymentMethod,
      deliveryInstructions,
      specialRequests,
    } = req.body;

    // Validate restaurant exists
    const restaurant = await Restaurant.findById(restaurantId);
    if (!restaurant) {
      return errorResponse(res, "Restaurant not found", 404);
    }

    // Validate menu items exist
    const menu = await Menu.findOne({ restaurant: restaurantId });
    if (!menu) {
      return errorResponse(res, "Menu not found for this restaurant", 404);
    }

    // Validate each item exists in the menu and get full item details
    const validatedItems = [];
    let totalAmount = 0;

    for (const orderItem of items) {
      const menuItem = menu.items.id(orderItem.itemId);
      if (!menuItem) {
        return errorResponse(
          res,
          `Menu item with ID ${orderItem.itemId} not found`,
          404
        );
      }

      // Check if item is available
      if (!menuItem.isAvailable) {
        return errorResponse(
          res,
          `Menu item "${menuItem.name}" is currently unavailable`,
          400
        );
      }

      // Add validated item with full details
      const validatedItem = {
        itemId: orderItem.itemId,
        name: menuItem.name,
        price: menuItem.price,
        quantity: orderItem.quantity,
      };

      validatedItems.push(validatedItem);
      totalAmount += menuItem.price * orderItem.quantity;
    }

    // Create order with validated items
    const order = new Order({
      user: req.user._id,
      restaurant: restaurantId,
      items: validatedItems,
      totalAmount,
      deliveryAddress,
      paymentMethod,
      deliveryInstructions,
      specialRequests,
    });

    await order.save();

    // Create notification for restaurant owner
    const notification = new Notification({
      recipient: restaurant.owner,
      type: "new_order",
      title: "New Order Received",
      message: `You have received a new order from ${req.user.name}`,
      relatedOrder: order._id,
    });

    await notification.save();

    // Get restaurant owner details for email
    const restaurantOwner = await User.findById(restaurant.owner);

    // Send order confirmation email to customer
    try {
      await sendOrderConfirmationEmail(req.user.email, order, restaurant);
    } catch (emailError) {
      console.error(
        "Error sending order confirmation email to customer:",
        emailError
      );
    }

    // Send order notification email to restaurant vendor
    try {
      if (restaurantOwner && restaurantOwner.email) {
        await sendRestaurantOrderNotificationEmail(
          restaurantOwner.email,
          order,
          req.user,
          restaurant
        );
      }
    } catch (emailError) {
      console.error(
        "Error sending order notification email to restaurant:",
        emailError
      );
      // Continue with the order process even if email fails
    }

    // Send real-time notification via WebSocket
    sendOrderStatusUpdate(order, null);

    successResponse(res, order, "Order created successfully", 201);
  } catch (error) {
    console.error("Error creating order:", error);
    errorResponse(res, error.message, 400);
  }
};

export const getUserOrders = async (req, res) => {
  try {
    const orders = await Order.find({ user: req.user._id })
      .populate("restaurant", "name cuisine")
      .sort({ createdAt: -1 });
    successResponse(res, orders, "User orders retrieved successfully");
  } catch (error) {
    errorResponse(res, error.message, 400);
  }
};

export const getOrderDetails = async (req, res) => {
  try {
    const { id } = req.params;
    const order = await Order.findById(id).populate(
      "restaurant",
      "name cuisine address phone"
    );

    if (!order) {
      return errorResponse(res, "Order not found", 404);
    }

    // Check if user is authorized to view this order
    if (
      req.user.role === "user" &&
      order.user.toString() !== req.user._id.toString()
    ) {
      return errorResponse(res, "Not authorized to view this order", 403);
    }

    // If vendor, check if order is for their restaurant
    if (req.user.role === "vendor") {
      const restaurant = await Restaurant.findOne({ owner: req.user._id });
      if (
        !restaurant ||
        order.restaurant._id.toString() !== restaurant._id.toString()
      ) {
        return errorResponse(res, "Not authorized to view this order", 403);
      }
    }

    successResponse(res, order, "Order details retrieved successfully");
  } catch (error) {
    errorResponse(res, error.message, 400);
  }
};

export const updateOrderStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, estimatedDeliveryTime } = req.body;

    const order = await Order.findById(id);
    if (!order) {
      return errorResponse(res, "Order not found", 404);
    }

    const validStatuses = [
      "pending",
      "confirmed",
      "preparing",
      "ready_for_pickup",
      "out_for_delivery",
      "delivered",
      "cancelled",
    ];
    if (!validStatuses.includes(status)) {
      return errorResponse(res, "Invalid order status", 400);
    }

    // Store previous status for WebSocket notification
    const previousStatus = order.status;

    // Update order
    const oldStatus = order.status;
    order.status = status;
    if (estimatedDeliveryTime) {
      order.estimatedDeliveryTime = estimatedDeliveryTime;
    }

    await order.save();

    // Create notification for user
    const notification = new Notification({
      recipient: order.user,
      type: "order_update",
      title: "Order Status Updated",
      message: `Your order #${order._id
        .toString()
        .slice(-6)} has been updated from ${oldStatus} to ${status}`,
      relatedOrder: order._id,
    });

    await notification.save();

    // Send real-time notification via WebSocket
    sendOrderStatusUpdate(order, previousStatus);

    successResponse(res, order, "Order status updated successfully");
  } catch (error) {
    errorResponse(res, error.message, 400);
  }
};

export const getRestaurantOrders = async (req, res) => {
  try {
    const { restaurantId } = req.params;
    const { status } = req.query;

    // Check if vendor is authorized to view orders for this restaurant
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

    // Build query
    const query = { restaurant: restaurantId };
    if (
      status &&
      [
        "pending",
        "confirmed",
        "preparing",
        "out_for_delivery",
        "delivered",
        "cancelled",
      ].includes(status)
    ) {
      query.status = status;
    }

    const orders = await Order.find(query).sort({ createdAt: -1 });
    successResponse(res, orders, "Restaurant orders retrieved successfully");
  } catch (error) {
    errorResponse(res, error.message, 400);
  }
};

export const getSubscriptionOrders = async (req, res) => {
  try {
    const { subscriptionId } = req.params;

    const subscription = await Subscription.findById(subscriptionId);
    if (!subscription) {
      return errorResponse(res, "Subscription not found", 404);
    }

    if (subscription.user.toString() !== req.user._id.toString()) {
      return errorResponse(
        res,
        "Not authorized to view orders for this subscription",
        403
      );
    }

    // Find orders related to this subscription
    const orders = await Order.find({
      subscription: subscriptionId,
    })
      .populate("restaurant", "name cuisine")
      .sort({ scheduledFor: 1 }); // Sort by scheduled date

    successResponse(res, orders, "Subscription orders retrieved successfully");
  } catch (error) {
    errorResponse(res, error.message, 400);
  }
};

export const cancelOrder = async (req, res) => {
  try {
    const { id } = req.params;
    const { cancellationReason } = req.body;

    const order = await Order.findById(id);
    if (!order) {
      return errorResponse(res, "Order not found", 404);
    }

    // Check if user is authorized to cancel this order
    if (
      req.user.role === "user" &&
      order.user.toString() !== req.user._id.toString()
    ) {
      return errorResponse(res, "Not authorized to cancel this order", 403);
    }

    // If vendor, check if order is for their restaurant
    if (req.user.role === "vendor") {
      const restaurant = await Restaurant.findOne({ owner: req.user._id });
      if (
        !restaurant ||
        order.restaurant.toString() !== restaurant._id.toString()
      ) {
        return errorResponse(res, "Not authorized to cancel this order", 403);
      }
    }

    // Check if order can be cancelled
    if (["delivered", "cancelled"].includes(order.status)) {
      return errorResponse(
        res,
        `Order cannot be cancelled as it is already ${order.status}`,
        400
      );
    }

    // Update order
    order.status = "cancelled";
    order.cancellationReason = cancellationReason || "Cancelled by user";
    order.cancelledAt = Date.now();

    await order.save();

    // Create notification
    let notificationRecipient;
    let notificationMessage;

    if (req.user.role === "user") {
      // If user cancelled, notify restaurant
      const restaurant = await Restaurant.findById(order.restaurant);
      notificationRecipient = restaurant.owner;
      notificationMessage = `Order #${order._id
        .toString()
        .slice(-6)} has been cancelled by the customer`;
    } else {
      // If restaurant cancelled, notify user
      notificationRecipient = order.user;
      notificationMessage = `Your order #${order._id
        .toString()
        .slice(-6)} has been cancelled by the restaurant`;
    }

    const notification = new Notification({
      recipient: notificationRecipient,
      type: "order_cancelled",
      title: "Order Cancelled",
      message: notificationMessage,
      relatedOrder: order._id,
    });

    await notification.save();

    successResponse(res, order, "Order cancelled successfully");
  } catch (error) {
    errorResponse(res, error.message, 400);
  }
};

export const getUpcomingSubscriptionOrders = async (req, res) => {
  try {
    // Get current date
    const now = new Date();

    // Find all active subscriptions for the user
    const subscriptions = await Subscription.find({
      user: req.user._id,
      status: "active",
    });

    if (subscriptions.length === 0) {
      return successResponse(res, [], "No active subscriptions found");
    }

    // Get subscription IDs
    const subscriptionIds = subscriptions.map((sub) => sub._id);

    // Find upcoming orders for these subscriptions
    const upcomingOrders = await Order.find({
      subscription: { $in: subscriptionIds },
      status: { $in: ["pending", "confirmed"] },
      scheduledFor: { $gte: now },
    })
      .populate("restaurant", "name")
      .sort({ scheduledFor: 1 });

    successResponse(
      res,
      upcomingOrders,
      "Upcoming subscription orders retrieved successfully"
    );
  } catch (error) {
    console.error("Error retrieving upcoming subscription orders:", error);
    errorResponse(res, error.message, 400);
  }
};
