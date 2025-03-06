import Subscription from "../models/Subscription.js";
import MealPlan from "../models/MealPlan.js";
import { successResponse, errorResponse } from "../utils/responseHandler.js";

export const createSubscription = async (req, res) => {
  try {
    const {
      mealPlanId,
      paymentMethod,
      deliveryAddress,
      deliveryInstructions,
      startDate,
    } = req.body;

    const mealPlan = await MealPlan.findById(mealPlanId);

    if (!mealPlan) {
      return errorResponse(res, "Meal plan not found", 404);
    }

    if (!mealPlan.isActive) {
      return errorResponse(res, "This meal plan is no longer active", 400);
    }

    if (
      mealPlan.maxSubscribers &&
      mealPlan.currentSubscribers >= mealPlan.maxSubscribers
    ) {
      return errorResponse(
        res,
        "This meal plan has reached its maximum subscribers",
        400
      );
    }

    const start = startDate ? new Date(startDate) : new Date();
    const endDate = new Date(start);

    if (mealPlan.duration === "daily") {
      endDate.setDate(endDate.getDate() + 1);
    } else if (mealPlan.duration === "weekly") {
      endDate.setDate(endDate.getDate() + 7);
    } else if (mealPlan.duration === "monthly") {
      endDate.setMonth(endDate.getMonth() + 1);
    }

    const renewalDate = new Date(endDate);

    const subscription = new Subscription({
      user: req.user._id,
      mealPlan: mealPlanId,
      startDate: start,
      endDate,
      renewalDate,
      paymentMethod,
      deliveryAddress,
      deliveryInstructions,
      totalAmount: mealPlan.price,
    });

    await subscription.save();

    // Update current subscribers count
    mealPlan.currentSubscribers += 1;
    await mealPlan.save();

    successResponse(
      res,
      subscription,
      "Subscription created successfully",
      201
    );
  } catch (error) {
    errorResponse(res, error.message, 400);
  }
};

export const getUserSubscriptions = async (req, res) => {
  try {
    const subscriptions = await Subscription.find({ user: req.user._id })
      .populate("mealPlan")
      .sort({ createdAt: -1 });
    successResponse(
      res,
      subscriptions,
      "User subscriptions retrieved successfully"
    );
  } catch (error) {
    errorResponse(res, error.message, 400);
  }
};

export const getSubscription = async (req, res) => {
  try {
    const { id } = req.params;
    const subscription = await Subscription.findById(id).populate("mealPlan");

    if (!subscription) {
      return errorResponse(res, "Subscription not found", 404);
    }

    if (subscription.user.toString() !== req.user._id.toString()) {
      return errorResponse(
        res,
        "Not authorized to view this subscription",
        403
      );
    }

    successResponse(res, subscription, "Subscription retrieved successfully");
  } catch (error) {
    errorResponse(res, error.message, 400);
  }
};

export const updateSubscription = async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body;

    const subscription = await Subscription.findById(id);
    if (!subscription) {
      return errorResponse(res, "Subscription not found", 404);
    }

    if (subscription.user.toString() !== req.user._id.toString()) {
      return errorResponse(
        res,
        "Not authorized to update this subscription",
        403
      );
    }

    if (subscription.status === "cancelled") {
      return errorResponse(res, "Cannot update a cancelled subscription", 400);
    }

    const updatedSubscription = await Subscription.findByIdAndUpdate(
      id,
      updateData,
      {
        new: true,
        runValidators: true,
      }
    );

    successResponse(
      res,
      updatedSubscription,
      "Subscription updated successfully"
    );
  } catch (error) {
    errorResponse(res, error.message, 400);
  }
};

export const cancelSubscription = async (req, res) => {
  try {
    const { id } = req.params;

    const subscription = await Subscription.findById(id);
    if (!subscription) {
      return errorResponse(res, "Subscription not found", 404);
    }

    if (subscription.user.toString() !== req.user._id.toString()) {
      return errorResponse(
        res,
        "Not authorized to cancel this subscription",
        403
      );
    }

    if (subscription.status === "cancelled") {
      return errorResponse(res, "Subscription is already cancelled", 400);
    }

    subscription.status = "cancelled";
    await subscription.save();

    // Decrease current subscribers count
    const mealPlan = await MealPlan.findById(subscription.mealPlan);
    if (mealPlan) {
      mealPlan.currentSubscribers = Math.max(
        0,
        mealPlan.currentSubscribers - 1
      );
      await mealPlan.save();
    }

    successResponse(res, null, "Subscription cancelled successfully");
  } catch (error) {
    errorResponse(res, error.message, 400);
  }
};

export const pauseSubscription = async (req, res) => {
  try {
    const { id } = req.params;

    const subscription = await Subscription.findById(id);
    if (!subscription) {
      return errorResponse(res, "Subscription not found", 404);
    }

    if (subscription.user.toString() !== req.user._id.toString()) {
      return errorResponse(
        res,
        "Not authorized to pause this subscription",
        403
      );
    }

    if (subscription.status !== "active") {
      return errorResponse(res, "Can only pause active subscriptions", 400);
    }

    subscription.status = "paused";

    await subscription.save();

    successResponse(res, subscription, "Subscription paused successfully");
  } catch (error) {
    errorResponse(res, error.message, 400);
  }
};

export const resumeSubscription = async (req, res) => {
  try {
    const { id } = req.params;

    const subscription = await Subscription.findById(id);
    if (!subscription) {
      return errorResponse(res, "Subscription not found", 404);
    }

    if (subscription.user.toString() !== req.user._id.toString()) {
      return errorResponse(
        res,
        "Not authorized to resume this subscription",
        403
      );
    }

    if (subscription.status !== "paused") {
      return errorResponse(res, "Can only resume paused subscriptions", 400);
    }

    subscription.status = "active";
    await subscription.save();

    successResponse(res, subscription, "Subscription resumed successfully");
  } catch (error) {
    errorResponse(res, error.message, 400);
  }
};
