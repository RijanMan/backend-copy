import cron from "node-cron";
import Subscription from "../models/Subscription.js";
import Order from "../models/Order.js";
import Notification from "../models/Notification.js";
import User from "../models/User.js";
import { sendSubscriptionReminderEmail } from "../utils/mailer.js";

/**
 * Service to check for upcoming subscription renewals and send reminders
 * This is called by the cron job
 */
export const checkSubscriptionRenewals = async () => {
  try {
    console.log("Checking for upcoming subscription renewals...");

    // Get current date
    const now = new Date();

    // Get date 3 days from now
    const threeDaysFromNow = new Date(now);
    threeDaysFromNow.setDate(now.getDate() + 3);

    // Find subscriptions that will renew in 3 days
    const subscriptions = await Subscription.find({
      status: "active",
      renewalDate: {
        $gte: now.setHours(0, 0, 0, 0),
        $lte: threeDaysFromNow.setHours(23, 59, 59, 999),
      },
    }).populate("mealPlan");

    console.log(
      `Found ${subscriptions.length} subscriptions due for renewal reminder`
    );

    // Send reminders for each subscription
    for (const subscription of subscriptions) {
      try {
        // Create notification
        const notification = new Notification({
          recipient: subscription.user,
          type: "subscription_reminder",
          title: "Subscription Renewal Reminder",
          message: `Your subscription to ${
            subscription.mealPlan.name
          } will renew on ${subscription.renewalDate.toLocaleDateString()}. Please ensure your payment method is up to date.`,
          relatedSubscription: subscription._id,
        });

        await notification.save();

        // Get user email
        const user = await User.findById(subscription.user);

        // Send email reminder
        if (user && user.email) {
          await sendSubscriptionReminderEmail(
            user.email,
            user.name,
            subscription.mealPlan.name,
            subscription.renewalDate
          );
        }

        console.log(`Reminder sent for subscription ${subscription._id}`);
      } catch (error) {
        console.error(
          `Error sending reminder for subscription ${subscription._id}:`,
          error
        );
        // Continue with next subscription even if one fails
      }
    }

    console.log("Subscription renewal check completed");
    return { success: true, count: subscriptions.length };
  } catch (error) {
    console.error("Error checking subscription renewals:", error);
    return { success: false, error: error.message };
  }
};

/**
 * Service to create upcoming subscription orders
 * This is called by the cron job daily
 */
export const createUpcomingSubscriptionOrders = async () => {
  try {
    console.log("Creating upcoming subscription orders...");

    // Get current date
    const now = new Date();

    // Get date for tomorrow
    const tomorrow = new Date(now);
    tomorrow.setDate(now.getDate() + 1);

    // Get the day of the week for tomorrow (0 = Sunday, 1 = Monday, etc.)
    const dayOfWeek = tomorrow.getDay();

    // Map day number to day name
    const dayNames = [
      "sunday",
      "monday",
      "tuesday",
      "wednesday",
      "thursday",
      "friday",
      "saturday",
    ];
    const tomorrowDayName = dayNames[dayOfWeek];

    // Skip Saturday (day 6) as it's not in our meal plan
    if (tomorrowDayName === "saturday") {
      console.log("Tomorrow is Saturday, skipping order creation");
      return { success: true, count: 0, message: "Saturday is not a meal day" };
    }

    // Find active subscriptions
    const subscriptions = await Subscription.find({
      status: "active",
      endDate: { $gte: now },
    }).populate({
      path: "mealPlan",
      populate: {
        path: "restaurant",
      },
    });

    console.log(`Found ${subscriptions.length} active subscriptions`);

    let ordersCreated = 0;

    // For each subscription, create orders for tomorrow
    for (const subscription of subscriptions) {
      try {
        // Find the menu for tomorrow in the meal plan
        const tomorrowMenu = subscription.mealPlan.weeklyMenu.find(
          (menu) => menu.day === tomorrowDayName
        );

        if (!tomorrowMenu) {
          console.log(
            `No menu found for ${tomorrowDayName} in meal plan ${subscription.mealPlan._id}`
          );
          continue;
        }

        // Get items based on selected diet type
        let items = [];
        if (
          subscription.selectedDietType === "vegetarian" &&
          tomorrowMenu.vegItems
        ) {
          items = tomorrowMenu.vegItems;
        } else if (
          subscription.selectedDietType === "vegan" &&
          tomorrowMenu.veganItems
        ) {
          items = tomorrowMenu.veganItems;
        } else if (
          subscription.selectedDietType === "non-vegetarian" &&
          tomorrowMenu.nonVegItems
        ) {
          items = tomorrowMenu.nonVegItems;
        }

        if (items.length === 0) {
          console.log(
            `No items found for diet type ${subscription.selectedDietType} on ${tomorrowDayName}`
          );
          continue;
        }

        // Create orders for selected meal times
        for (const mealTime of subscription.selectedMealTimes) {
          // Skip if mealTime is "both" - we'll create separate morning and evening orders
          if (mealTime === "both") continue;

          // If "both" is selected, create orders for both morning and evening
          if (
            subscription.selectedMealTimes.includes("both") ||
            subscription.selectedMealTimes.includes(mealTime)
          ) {
            // Check if order already exists
            const existingOrder = await Order.findOne({
              subscription: subscription._id,
              dayOfWeek: tomorrowDayName,
              mealTime: mealTime,
              scheduledFor: {
                $gte: new Date(tomorrow.setHours(0, 0, 0, 0)),
                $lt: new Date(tomorrow.setHours(23, 59, 59, 999)),
              },
            });

            if (existingOrder) {
              console.log(
                `Order already exists for subscription ${subscription._id} on ${tomorrowDayName} for ${mealTime}`
              );
              continue;
            }

            const order = new Order({
              user: subscription.user,
              restaurant: subscription.mealPlan.restaurant._id,
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
              scheduledFor: tomorrow,
              dayOfWeek: tomorrowDayName,
              mealTime: mealTime,
              dietType: subscription.selectedDietType,
            });

            await order.save();
            ordersCreated++;

            // Create notification for user
            const notification = new Notification({
              recipient: subscription.user,
              type: "subscription_order",
              title: "Subscription Order Created",
              message: `Your ${mealTime} meal for ${tomorrowDayName} has been scheduled for delivery tomorrow.`,
              relatedOrder: order._id,
            });

            await notification.save();

            // Create notification for restaurant
            const restaurantNotification = new Notification({
              recipient: subscription.mealPlan.restaurant.owner,
              type: "subscription_order",
              title: "New Subscription Order",
              message: `A new subscription order has been created for ${tomorrowDayName}, ${mealTime}.`,
              relatedOrder: order._id,
            });

            await restaurantNotification.save();
          }
        }
      } catch (error) {
        console.error(
          `Error creating orders for subscription ${subscription._id}:`,
          error
        );
        // Continue with next subscription even if one fails
      }
    }

    console.log(
      `Created ${ordersCreated} orders for tomorrow (${tomorrowDayName})`
    );
    return { success: true, count: ordersCreated };
  } catch (error) {
    console.error("Error creating upcoming subscription orders:", error);
    return { success: false, error: error.message };
  }
};

/**
 * Service to renew subscriptions that are due
 * This is called by the cron job daily
 */
export const renewSubscriptions = async () => {
  try {
    console.log("Checking for subscriptions to renew...");

    // Get current date
    const now = new Date();

    // Find subscriptions that are due for renewal
    const subscriptions = await Subscription.find({
      status: "active",
      renewalDate: {
        $lte: now,
      },
    }).populate("mealPlan");

    console.log(`Found ${subscriptions.length} subscriptions due for renewal`);

    let renewedCount = 0;

    // Renew each subscription
    for (const subscription of subscriptions) {
      try {
        // Calculate new dates
        const newStartDate = new Date(subscription.renewalDate);
        const newEndDate = new Date(newStartDate);

        if (subscription.mealPlan.duration === "weekly") {
          newEndDate.setDate(newEndDate.getDate() + 7);
        } else if (subscription.mealPlan.duration === "monthly") {
          newEndDate.setMonth(newEndDate.getMonth() + 1);
        }

        // Set new renewal date
        const newRenewalDate = new Date(newEndDate);

        // Update subscription
        subscription.startDate = newStartDate;
        subscription.endDate = newEndDate;
        subscription.renewalDate = newRenewalDate;

        await subscription.save();
        renewedCount++;

        // Create notification for user
        const notification = new Notification({
          recipient: subscription.user,
          type: "subscription_renewed",
          title: "Subscription Renewed",
          message: `Your subscription to ${
            subscription.mealPlan.name
          } has been renewed until ${newEndDate.toLocaleDateString()}.`,
          relatedSubscription: subscription._id,
        });

        await notification.save();

        console.log(`Renewed subscription ${subscription._id}`);
      } catch (error) {
        console.error(
          `Error renewing subscription ${subscription._id}:`,
          error
        );
        // Continue with next subscription even if one fails
      }
    }

    console.log(`Renewed ${renewedCount} subscriptions`);
    return { success: true, count: renewedCount };
  } catch (error) {
    console.error("Error renewing subscriptions:", error);
    return { success: false, error: error.message };
  }
};

/**
 * Initialize all cron jobs
 */
export const initCronJobs = () => {
  // Run subscription renewal check every day at midnight
  cron.schedule("0 0 * * *", async () => {
    console.log("Running subscription renewal check...");
    try {
      const result = await checkSubscriptionRenewals();
      console.log("Subscription renewal check completed:", result);
    } catch (error) {
      console.error("Error in subscription renewal cron job:", error);
    }
  });

  // Run subscription renewal every day at 1 AM
  cron.schedule("0 1 * * *", async () => {
    console.log("Running subscription renewal...");
    try {
      const result = await renewSubscriptions();
      console.log("Subscription renewal completed:", result);
    } catch (error) {
      console.error("Error in subscription renewal cron job:", error);
    }
  });

  // Create upcoming subscription orders every day at 2 AM
  cron.schedule("0 2 * * *", async () => {
    console.log("Creating upcoming subscription orders...");
    try {
      const result = await createUpcomingSubscriptionOrders();
      console.log("Upcoming subscription orders created:", result);
    } catch (error) {
      console.error(
        "Error in creating upcoming subscription orders cron job:",
        error
      );
    }
  });

  console.log("Cron jobs initialized");
};
