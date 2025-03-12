import { Server } from "socket.io";
import jwt from "jsonwebtoken";
import User from "../models/User.js";

let io;

/**
 * Initialize the Socket.IO server
 * @param {Object} server - HTTP server instance
 */
export const initSocketServer = (server) => {
  io = new Server(server, {
    cors: {
      origin: process.env.CLIENT_URL || "*",
      methods: ["GET", "POST"],
      credentials: true,
    },
  });

  // Socket.IO middleware for authentication
  io.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth.token || socket.handshake.query.token;

      if (!token) {
        return next(new Error("Authentication error: Token required"));
      }

      // Verify token
      const decoded = jwt.verify(token, process.env.JWT_SECRET);

      // Get user from database
      const user = await User.findById(decoded.id).select("-password");

      if (!user) {
        return next(new Error("Authentication error: User not found"));
      }

      // Attach user to socket
      socket.user = user;
      next();
    } catch (error) {
      console.error("Socket authentication error:", error);
      next(new Error("Authentication error: " + error.message));
    }
  });

  // Connection event
  io.on("connection", (socket) => {
    console.log(`User connected: ${socket.user._id} (${socket.user.role})`);

    // Join user to their own room for private messages
    socket.join(socket.user._id.toString());

    // Join role-based room
    socket.join(`role:${socket.user.role}`);

    // If user is a vendor, join restaurant room
    if (
      socket.user.role === "vendor" &&
      socket.user.ownedRestaurants &&
      socket.user.ownedRestaurants.length > 0
    ) {
      socket.user.ownedRestaurants.forEach((restaurantId) => {
        socket.join(`restaurant:${restaurantId}`);
      });
    }

    // If user is a rider, join rider room
    if (socket.user.role === "rider") {
      socket.join("riders");
    }

    // Disconnect event
    socket.on("disconnect", () => {
      console.log(`User disconnected: ${socket.user._id}`);
    });
  });

  console.log("Socket.IO server initialized");
  return io;
};

/**
 * Get the Socket.IO instance
 * @returns {Object} Socket.IO instance
 */
export const getIO = () => {
  if (!io) {
    throw new Error("Socket.IO not initialized");
  }
  return io;
};

/**
 * Send a notification to a specific user
 * @param {string} userId - User ID
 * @param {string} type - Notification type
 * @param {Object} data - Notification data
 */
export const sendNotificationToUser = (userId, type, data) => {
  if (!io) return;
  io.to(userId.toString()).emit("notification", { type, data });
};

/**
 * Send a notification to all users with a specific role
 * @param {string} role - User role (user, vendor, rider, admin)
 * @param {string} type - Notification type
 * @param {Object} data - Notification data
 */
export const sendNotificationToRole = (role, type, data) => {
  if (!io) return;
  io.to(`role:${role}`).emit("notification", { type, data });
};

/**
 * Send a notification to all users in a restaurant
 * @param {string} restaurantId - Restaurant ID
 * @param {string} type - Notification type
 * @param {Object} data - Notification data
 */
export const sendNotificationToRestaurant = (restaurantId, type, data) => {
  if (!io) return;
  io.to(`restaurant:${restaurantId}`).emit("notification", { type, data });
};

/**
 * Send an order update notification
 * @param {Object} order - Order object
 * @param {string} previousStatus - Previous order status
 */
export const sendOrderStatusUpdate = (order, previousStatus) => {
  if (!io) return;

  const orderData = {
    orderId: order._id,
    status: order.status,
    previousStatus,
    restaurantId: order.restaurant,
    updatedAt: new Date(),
  };

  // Send to customer
  sendNotificationToUser(order.user, "order_status_update", orderData);

  // Send to restaurant
  sendNotificationToRestaurant(
    order.restaurant,
    "order_status_update",
    orderData
  );

  // If order is assigned to a rider, send to rider
  if (order.rider) {
    sendNotificationToUser(order.rider, "order_status_update", orderData);
  }

  // If order status is 'ready_for_pickup', notify all available riders
  if (order.status === "ready_for_pickup" && !order.rider) {
    io.to("riders").emit("new_available_order", orderData);
  }
};

/**
 * Send a customization request notification
 * @param {Object} request - Customization request object
 * @param {string} type - Notification type (new, approved, rejected, completed)
 */
export const sendCustomizationRequestUpdate = (request, type) => {
  if (!io) return;

  const requestData = {
    requestId: request._id,
    status: request.status,
    restaurantId: request.restaurant,
    userId: request.user,
    updatedAt: new Date(),
  };

  // Send to customer
  sendNotificationToUser(
    request.user,
    `customization_request_${type}`,
    requestData
  );

  // Send to restaurant
  sendNotificationToRestaurant(
    request.restaurant,
    `customization_request_${type}`,
    requestData
  );
};

/**
 * Send a new meal plan notification
 * @param {Object} mealPlan - Meal plan object
 * @param {string} userId - User ID to notify
 */
export const sendNewMealPlanNotification = (mealPlan, userId) => {
  if (!io) return;

  const mealPlanData = {
    mealPlanId: mealPlan._id,
    name: mealPlan.name,
    restaurantId: mealPlan.restaurant,
    createdAt: new Date(),
  };

  sendNotificationToUser(userId, "new_meal_plan", mealPlanData);
};
