import Subscription from "../models/Subscription.js";
import MealPlan from "../models/MealPlan.js";
import Order from "../models/Order.js";
import Notification from "../models/Notification.js";
import { successResponse, errorResponse } from "../utils/responseHandler.js";

export const createSubscription = async (req, res) => {
  try {
    const {
      mealPlanId,
      selectedDietType,
      selectedMealTimes,
      paymentMethod,
      startDate,
      deliveryAddress,
      deliveryInstructions,
    } = req.body;

    if (startDate && new Date(startDate) < new Date()) {
      return errorResponse(res, "Start date cannot be in the past", 400);
    }

    const mealPlan = await MealPlan.findById(mealPlanId);

    if (!mealPlan) {
      return errorResponse(res, "Meal plan not found", 404);
    }

    if (!mealPlan.isActive) {
      return errorResponse(res, "This meal plan is no longer active", 400);
    }

    // Check if it's a custom meal plan and if the user is authorized
    if (mealPlan.isCustom && mealPlan.customFor) {
      if (mealPlan.customFor.toString() !== req.user._id.toString()) {
        return errorResponse(
          res,
          "Not authorized to subscribe to this custom meal plan",
          403
        );
      }
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

    // Validate diet type
    if (!["vegetarian", "vegan", "non-vegetarian"].includes(selectedDietType)) {
      return errorResponse(
        res,
        "Invalid diet type. Must be vegetarian, vegan, or non-vegetarian",
        400
      );
    }

    // Validate meal times
    if (
      !selectedMealTimes ||
      !Array.isArray(selectedMealTimes) ||
      selectedMealTimes.length === 0
    ) {
      return errorResponse(res, "At least one meal time must be selected", 400);
    }

    for (const mealTime of selectedMealTimes) {
      if (!["morning", "evening", "both"].includes(mealTime)) {
        return errorResponse(
          res,
          "Invalid meal time. Must be morning, evening, or both",
          400
        );
      }
    }

    const start = startDate ? new Date(startDate) : new Date();
    const endDate = new Date(start);

    if (mealPlan.duration === "weekly") {
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
      selectedDietType,
      selectedMealTimes,
      paymentMethod,
      deliveryAddress,
      deliveryInstructions,
      totalAmount: mealPlan.price,
    });

    await subscription.save();

    // Update current subscribers count
    mealPlan.currentSubscribers += 1;
    await mealPlan.save();

    // Create initial orders for the subscription
    await createSubscriptionOrders(subscription, mealPlan, req.user);

    // Schedule a renewal reminder notification (3 days before renewal)
    const reminderDate = new Date(renewalDate);
    reminderDate.setDate(reminderDate.getDate() - 3);

    // Create a notification for the renewal reminder
    const notification = new Notification({
      recipient: req.user._id,
      type: "subscription_reminder",
      title: "Subscription Renewal Reminder",
      message: `Your subscription to ${
        mealPlan.name
      } will renew on ${renewalDate.toLocaleDateString()}. Please ensure your payment method is up to date.`,
      relatedSubscription: subscription._id,
      // This notification will be marked as unread until the reminder date
      isRead: false,
    });

    await notification.save();

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

const createSubscriptionOrders = async (subscription, mealPlan, user) => {
  try {
    const days = [
      "sunday",
      "monday",
      "tuesday",
      "wednesday",
      "thursday",
      "friday",
    ];
    const today = new Date();

    // Create orders for each day in the weekly menu
    for (const dayMenu of mealPlan.weeklyMenu) {
      const dayIndex = days.indexOf(dayMenu.day);
      if (dayIndex === -1) continue;

      const currentDayOfWeek = today.getDay();
      let daysToAdd = dayIndex - currentDayOfWeek;
      if (daysToAdd < 0) daysToAdd += 7;

      const orderDate = new Date(today);
      orderDate.setDate(today.getDate() + daysToAdd);

      // Get items based on selected diet type
      let items = [];
      if (subscription.selectedDietType === "vegetarian" && dayMenu.vegItems) {
        items = dayMenu.vegItems;
      } else if (
        subscription.selectedDietType === "vegan" &&
        dayMenu.veganItems
      ) {
        items = dayMenu.veganItems;
      } else if (
        subscription.selectedDietType === "non-vegetarian" &&
        dayMenu.nonVegItems
      ) {
        items = dayMenu.nonVegItems;
      }

      if (items.length === 0) continue;

      // Create orders for selected meal times
      for (const mealTime of subscription.selectedMealTimes) {
        // Skip if mealTime is "both" - we'll create separate morning and evening orders
        if (mealTime === "both") continue;

        // If "both" is selected, create orders for both morning and evening
        if (
          subscription.selectedMealTimes.includes("both") ||
          subscription.selectedMealTimes.includes(mealTime)
        ) {
          const order = new Order({
            user: user._id,
            restaurant: mealPlan.restaurant,
            subscription: subscription._id,
            items: items.map((item) => ({
              itemId: item.itemId,
              name: item.name,
              price: item.price,
              quantity: 1,
            })),
            totalAmount: items.reduce((total, item) => total + item.price, 0),
            deliveryAddress: subscription.deliveryAddress,
            paymentMethod: subscription.paymentMethod,
            deliveryInstructions: subscription.deliveryInstructions,
            status: "confirmed",
            scheduledFor: orderDate,
            dayOfWeek: dayMenu.day,
            mealTime: mealTime,
            dietType: subscription.selectedDietType,
          });

          await order.save();
        }
      }
    }
  } catch (error) {
    console.error("Error creating subscription orders:", error);
    // Continue with subscription creation even if order creation fails
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

    // Cancel any pending orders for this subscription
    await Order.updateMany(
      {
        subscription: subscription._id,
        status: { $in: ["pending", "confirmed"] },
      },
      {
        status: "cancelled",
        cancellationReason: "Subscription cancelled by user",
        cancelledAt: new Date(),
      }
    );

    successResponse(res, null, "Subscription cancelled successfully");
  } catch (error) {
    errorResponse(res, error.message, 400);
  }
};

// export const pauseSubscription = async (req, res) => {
//   try {
//     const { id } = req.params;

//     const subscription = await Subscription.findById(id);
//     if (!subscription) {
//       return errorResponse(res, "Subscription not found", 404);
//     }

//     if (subscription.user.toString() !== req.user._id.toString()) {
//       return errorResponse(
//         res,
//         "Not authorized to pause this subscription",
//         403
//       );
//     }

//     if (subscription.status !== "active") {
//       return errorResponse(res, "Can only pause active subscriptions", 400);
//     }

//     subscription.status = "paused";

//     await subscription.save();

//     successResponse(res, subscription, "Subscription paused successfully");
//   } catch (error) {
//     errorResponse(res, error.message, 400);
//   }
// };

// export const resumeSubscription = async (req, res) => {
//   try {
//     const { id } = req.params;

//     const subscription = await Subscription.findById(id);
//     if (!subscription) {
//       return errorResponse(res, "Subscription not found", 404);
//     }

//     if (subscription.user.toString() !== req.user._id.toString()) {
//       return errorResponse(
//         res,
//         "Not authorized to resume this subscription",
//         403
//       );
//     }

//     if (subscription.status !== "paused") {
//       return errorResponse(res, "Can only resume paused subscriptions", 400);
//     }

//     subscription.status = "active";
//     await subscription.save();

//     successResponse(res, subscription, "Subscription resumed successfully");
//   } catch (error) {
//     errorResponse(res, error.message, 400);
//   }
// };
