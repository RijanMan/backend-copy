import Notification from "../models/Notification.js";
import { successResponse, errorResponse } from "../utils/responseHandler.js";

export const createNotification = async (req, res) => {
  try {
    const {
      recipient,
      type,
      title,
      message,
      relatedOrder,
      relatedSubscription,
    } = req.body;

    const notification = new Notification({
      recipient,
      type,
      title,
      message,
      relatedOrder,
      relatedSubscription,
    });

    await notification.save();
    successResponse(
      res,
      notification,
      "Notification created successfully",
      201
    );
  } catch (error) {
    errorResponse(res, error.message, 400);
  }
};

export const getUserNotifications = async (req, res) => {
  try {
    const notifications = await Notification.find({
      recipient: req.user._id,
    }).sort({ createdAt: -1 });
    successResponse(
      res,
      notifications,
      "User notifications retrieved successfully"
    );
  } catch (error) {
    errorResponse(res, error.message, 400);
  }
};

export const markNotificationAsRead = async (req, res) => {
  try {
    const notification = await Notification.findById(req.params.id);
    if (!notification) {
      return errorResponse(res, "Notification not found", 404);
    }

    if (notification.recipient.toString() !== req.user._id.toString()) {
      return errorResponse(
        res,
        "Not authorized to update this notification",
        403
      );
    }

    notification.isRead = true;
    await notification.save();

    successResponse(res, notification, "Notification marked as read");
  } catch (error) {
    errorResponse(res, error.message, 400);
  }
};

export const deleteNotification = async (req, res) => {
  try {
    const notification = await Notification.findById(req.params.id);
    if (!notification) {
      return errorResponse(res, "Notification not found", 404);
    }

    if (notification.recipient.toString() !== req.user._id.toString()) {
      return errorResponse(
        res,
        "Not authorized to delete this notification",
        403
      );
    }

    await notification.remove();
    successResponse(res, null, "Notification deleted successfully");
  } catch (error) {
    errorResponse(res, error.message, 400);
  }
};
