import User from "../models/User.js";
import Order from "../models/Order.js";
import { successResponse, errorResponse } from "../utils/responseHandler.js";

export const updateAvailability = async (req, res) => {
  try {
    const { isAvailable } = req.body;
    const rider = await User.findById(req.user._id);

    if (!rider || rider.role !== "rider") {
      return errorResponse(res, "Rider not found", 404);
    }

    rider.isAvailable = isAvailable;
    await rider.save();

    successResponse(
      res,
      { isAvailable: rider.isAvailable },
      "Availability updated successfully"
    );
  } catch (error) {
    errorResponse(res, error.message, 400);
  }
};

export const getAvailableOrders = async (req, res) => {
  try {
    const rider = await User.findById(req.user._id);

    if (!rider || rider.role !== "rider") {
      return errorResponse(res, "Rider not found", 404);
    }

    const availableOrders = await Order.find({
      status: "ready_for_pickup",
      rider: null,
    }).populate("restaurant", "name address");

    successResponse(
      res,
      availableOrders,
      "Available orders retrieved successfully"
    );
  } catch (error) {
    errorResponse(res, error.message, 400);
  }
};

export const acceptOrder = async (req, res) => {
  try {
    const { orderId } = req.params;
    const rider = await User.findById(req.user._id);

    if (!rider || rider.role !== "rider") {
      return errorResponse(res, "Rider not found", 404);
    }

    const order = await Order.findById(orderId);

    if (!order || order.status !== "ready_for_pickup" || order.rider) {
      return errorResponse(res, "Order not available", 400);
    }

    order.rider = rider._id;
    order.status = "out_for_delivery";
    await order.save();

    successResponse(res, order, "Order accepted successfully");
  } catch (error) {
    errorResponse(res, error.message, 400);
  }
};

export const updateOrderStatus = async (req, res) => {
  try {
    const { orderId } = req.params;
    const { status } = req.body;
    const rider = await User.findById(req.user._id);

    if (!rider || rider.role !== "rider") {
      return errorResponse(res, "Rider not found", 404);
    }

    const order = await Order.findById(orderId);

    if (!order || order.rider.toString() !== rider._id.toString()) {
      return errorResponse(
        res,
        "Order not found or not assigned to this rider",
        404
      );
    }

    if (!["out_for_delivery", "delivered"].includes(status)) {
      return errorResponse(res, "Invalid status", 400);
    }

    order.status = status;
    if (status === "delivered") {
      order.deliveredAt = Date.now();
    }
    await order.save();

    successResponse(res, order, "Order status updated successfully");
  } catch (error) {
    errorResponse(res, error.message, 400);
  }
};

export const getRiderOrders = async (req, res) => {
  try {
    const rider = await User.findById(req.user._id);

    if (!rider || rider.role !== "rider") {
      return errorResponse(res, "Rider not found", 404);
    }

    const { status } = req.query;
    const query = { rider: rider._id };

    if (status) {
      query.status = status;
    }

    const orders = await Order.find(query)
      .populate("restaurant", "name address")
      .populate("user", "name")
      .sort({ createdAt: -1 });

    successResponse(res, orders, "Rider orders retrieved successfully");
  } catch (error) {
    errorResponse(res, error.message, 400);
  }
};

// export const getRiderEarnings = async (req, res) => {
//   try {
//     const rider = await User.findById(req.user._id);

//     if (!rider || rider.role !== "rider") {
//       return errorResponse(res, "Rider not found", 404);
//     }

//     const { startDate, endDate } = req.query;
//     const query = { rider: rider._id, status: "delivered" };

//     if (startDate && endDate) {
//       query.deliveredAt = {
//         $gte: new Date(startDate),
//         $lte: new Date(endDate),
//       };
//     }

//     const completedOrders = await Order.find(query);

//     const earnings = completedOrders.reduce(
//       (total, order) => total + order.deliveryFee,
//       0
//     );

//     successResponse(
//       res,
//       { earnings, completedOrders },
//       "Rider earnings retrieved successfully"
//     );
//   } catch (error) {
//     errorResponse(res, error.message, 400);
//   }
// };
