import Payment from "../models/Payment.js";
import { successResponse, errorResponse } from "../utils/responseHandler.js";

export const createPayment = async (req, res) => {
  try {
    const { amount, paymentMethod, relatedOrder, relatedSubscription } =
      req.body;

    const payment = new Payment({
      user: req.user._id,
      amount,
      paymentMethod,
      relatedOrder,
      relatedSubscription,
      transactionId: `TRX${Date.now()}`,
    });

    await payment.save();
    successResponse(res, payment, "Payment created successfully", 201);
  } catch (error) {
    errorResponse(res, error.message, 400);
  }
};

export const getPaymentById = async (req, res) => {
  try {
    const payment = await Payment.findById(req.params.id);
    if (!payment) {
      return errorResponse(res, "Payment not found", 404);
    }

    if (
      payment.user.toString() !== req.user._id.toString() &&
      req.user.role !== "admin"
    ) {
      return errorResponse(res, "Not authorized to view this payment", 403);
    }

    successResponse(res, payment, "Payment retrieved successfully");
  } catch (error) {
    errorResponse(res, error.message, 400);
  }
};

export const getUserPayments = async (req, res) => {
  try {
    const payments = await Payment.find({ user: req.user._id }).sort({
      createdAt: -1,
    });
    successResponse(res, payments, "User payments retrieved successfully");
  } catch (error) {
    errorResponse(res, error.message, 400);
  }
};

export const updatePaymentStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    const payment = await Payment.findById(id);
    if (!payment) {
      return errorResponse(res, "Payment not found", 404);
    }

    payment.status = status;
    await payment.save();

    successResponse(res, payment, "Payment status updated successfully");
  } catch (error) {
    errorResponse(res, error.message, 400);
  }
};
