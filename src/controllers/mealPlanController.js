import MealPlan from "../models/MealPlan.js";
import Restaurant from "../models/Restaurant.js";
import CustomizationRequest from "../models/CustomizationRequest.js";
import Notification from "../models/Notification.js";
import { successResponse, errorResponse } from "../utils/responseHandler.js";
import { filePathToUrl } from "../middlewares/uploadMiddleware.js";
import {
  sendNewMealPlanNotification,
  sendCustomizationRequestUpdate,
} from "../services/socketService.js";

export const createMealPlan = async (req, res) => {
  try {
    const { restaurantId } = req.params;
    const {
      name,
      description,
      tier,
      price,
      duration,
      maxSubscribers,
      weeklyMenu,
    } = req.body;

    const restaurant = await Restaurant.findById(restaurantId);
    if (!restaurant) {
      return errorResponse(res, "Restaurant not found", 404);
    }

    if (restaurant.owner.toString() !== req.user._id.toString()) {
      return errorResponse(
        res,
        "Not authorized to create meal plans for this restaurant",
        403
      );
    }

    // Validate tier
    if (!["regular", "custom", "business"].includes(tier)) {
      return errorResponse(
        res,
        "Invalid tier. Must be 'regular', 'custom', or 'business'",
        400
      );
    }

    // Validate weekly menu
    if (!weeklyMenu || !Array.isArray(weeklyMenu) || weeklyMenu.length === 0) {
      return errorResponse(res, "Weekly menu is required", 400);
    }

    // Parse weekly menu if it's a string
    let parsedWeeklyMenu = weeklyMenu;
    if (typeof weeklyMenu === "string") {
      try {
        parsedWeeklyMenu = JSON.parse(weeklyMenu);
      } catch (e) {
        return errorResponse(res, "Invalid weekly menu format", 400);
      }
    }
    // Validate each day in the weekly menu
    const validDays = [
      "sunday",
      "monday",
      "tuesday",
      "wednesday",
      "thursday",
      "friday",
    ];
    for (const menuItem of parsedWeeklyMenu) {
      if (!validDays.includes(menuItem.day)) {
        return errorResponse(
          res,
          `Invalid day in weekly menu: ${menuItem.day}`,
          400
        );
      }

      // Ensure at least one type of meal is provided
      if (
        (!menuItem.vegItems || menuItem.vegItems.length === 0) &&
        (!menuItem.nonVegItems || menuItem.nonVegItems.length === 0) &&
        (!menuItem.veganItems || menuItem.veganItems.length === 0)
      ) {
        return errorResponse(
          res,
          `At least one meal type (veg, non-veg, or vegan) is required for ${menuItem.day}`,
          400
        );
      }
    }
    // Ensure each item has the required fields
    const validateItems = (items, type) => {
      if (!items || !Array.isArray(items)) return true;

      for (const item of items) {
        if (!item.itemId || !item.name || !item.price || !item.description) {
          return errorResponse(
            res,
            `Each ${type} item must have itemId, name, price, and description fields`,
            400
          );
        }
      }
      return true;
    };

    for (const menuItem of parsedWeeklyMenu) {
      if (!validateItems(menuItem.vegItems, "vegetarian")) return;
      if (!validateItems(menuItem.nonVegItems, "non-vegetarian")) return;
      if (!validateItems(menuItem.veganItems, "vegan")) return;
    }

    const mealPlan = new MealPlan({
      restaurant: restaurantId,
      name,
      description,
      tier,
      price,
      duration: duration || "weekly",
      maxSubscribers: maxSubscribers ? Number(maxSubscribers) : undefined,
      weeklyMenu: parsedWeeklyMenu,
      isActive: true,
    });

    if (req.file) {
      mealPlanData.image = `/uploads/meal-plans/${req.file.filename}`;
    }

    await mealPlan.save();
    successResponse(res, mealPlan, "Meal plan created successfully", 201);
  } catch (error) {
    console.error("Error creating meal plan:", error);
    if (error.name === "ValidationError") {
      const validationErrors = Object.values(error.errors).map(
        (err) => err.message
      );
      return errorResponse(res, "Validation error", 400, validationErrors);
    }
    errorResponse(res, error.message, 400);
  }
};

export const createCustomMealPlan = async (req, res) => {
  try {
    const { customizationRequestId } = req.params;
    const { name, description, price, duration, weeklyMenu } = req.body;

    // Find the customization request
    const customizationRequest = await CustomizationRequest.findById(
      customizationRequestId
    ).populate("user", "name email");

    if (!customizationRequest) {
      return errorResponse(res, "Customization request not found", 404);
    }

    // Check if vendor is authorized
    const restaurant = await Restaurant.findById(
      customizationRequest.restaurant
    );
    if (!restaurant) {
      return errorResponse(res, "Restaurant not found", 404);
    }

    if (restaurant.owner.toString() !== req.user._id.toString()) {
      return errorResponse(
        res,
        "Not authorized to create custom meal plan for this request",
        403
      );
    }

    // Check if request is approved
    if (customizationRequest.status !== "approved") {
      return errorResponse(
        res,
        "Cannot create meal plan for a request that is not approved",
        400
      );
    }

    // Check if meal plan already exists
    if (customizationRequest.resultingMealPlan) {
      return errorResponse(
        res,
        "A meal plan has already been created for this request",
        400
      );
    }

    // Validate weekly menu
    if (!weeklyMenu || !Array.isArray(weeklyMenu) || weeklyMenu.length === 0) {
      return errorResponse(res, "Weekly menu is required", 400);
    }

    // Parse weekly menu if it's a string
    let parsedWeeklyMenu = weeklyMenu;
    if (typeof weeklyMenu === "string") {
      try {
        parsedWeeklyMenu = JSON.parse(weeklyMenu);
      } catch (e) {
        return errorResponse(res, "Invalid weekly menu format", 400);
      }
    }

    // Create the custom meal plan
    const mealPlan = new MealPlan({
      restaurant: customizationRequest.restaurant,
      name,
      description,
      tier: "custom",
      price: Number(price),
      duration: duration || "weekly",
      weeklyMenu: parsedWeeklyMenu,
      isActive: true,
      isCustom: true,
      customFor: customizationRequest.user,
      customizationRequest: customizationRequest._id,
    });

    if (req.file) {
      mealPlan.image = filePathToUrl(req.file.path);
    }

    await mealPlan.save();

    // Update the customization request
    customizationRequest.status = "completed";
    customizationRequest.resultingMealPlan = mealPlan._id;
    await customizationRequest.save();

    // Create notification for user
    const notification = new Notification({
      recipient: customizationRequest.user._id,
      type: "custom_meal_plan",
      title: "Custom Meal Plan Created",
      message: `${restaurant.name} has created a custom meal plan for you based on your requirements. Check it out!`,
      relatedMealPlan: mealPlan._id,
    });

    sendNewMealPlanNotification(mealPlan, customizationRequest.user._id);
    sendCustomizationRequestUpdate(customizationRequest, "completed");

    await notification.save();

    successResponse(
      res,
      mealPlan,
      "Custom meal plan created successfully",
      201
    );
  } catch (error) {
    console.error("Error creating custom meal plan:", error);
    if (error.name === "ValidationError") {
      const validationErrors = Object.values(error.errors).map(
        (err) => err.message
      );
      return errorResponse(res, "Validation error", 400, validationErrors);
    }
    errorResponse(res, error.message, 400);
  }
};

export const getMealPlans = async (req, res) => {
  try {
    const { restaurantId } = req.params;
    const { tier } = req.query;

    const restaurant = await Restaurant.findById(restaurantId);
    if (!restaurant) {
      return errorResponse(res, "Restaurant not found", 404);
    }

    // Build query
    const query = {
      restaurant: restaurantId,
      isActive: true,
      isCustom: false, // Don't show custom meal plans in general listing
    };

    if (tier && ["regular", "custom", "business"].includes(tier)) {
      query.tier = tier;
    }

    const mealPlans = await MealPlan.find(query).sort({ createdAt: -1 });
    successResponse(res, mealPlans, "Meal plans retrieved successfully");
  } catch (error) {
    errorResponse(res, error.message, 400);
  }
};

export const getUserCustomMealPlans = async (req, res) => {
  try {
    // Find custom meal plans created specifically for this user
    const mealPlans = await MealPlan.find({
      customFor: req.user._id,
      isCustom: true,
      isActive: true,
    })
      .populate("restaurant", "name cuisine")
      .populate("customizationRequest")
      .sort({ createdAt: -1 });

    successResponse(res, mealPlans, "Custom meal plans retrieved successfully");
  } catch (error) {
    errorResponse(res, error.message, 400);
  }
};

export const getMealPlanDetails = async (req, res) => {
  try {
    const { id } = req.params;
    const mealPlan = await MealPlan.findById(id).populate(
      "restaurant",
      "name cuisine address"
    );

    if (!mealPlan) {
      return errorResponse(res, "Meal plan not found", 404);
    }

    // If it's a custom meal plan, check if the user is authorized to view it
    if (mealPlan.isCustom && mealPlan.customFor) {
      if (
        req.user.role === "user" &&
        mealPlan.customFor.toString() !== req.user._id.toString()
      ) {
        return errorResponse(
          res,
          "Not authorized to view this custom meal plan",
          403
        );
      }
    }

    successResponse(res, mealPlan, "Meal plan details retrieved successfully");
  } catch (error) {
    errorResponse(res, error.message, 400);
  }
};

export const updateMealPlan = async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = { ...req.body };

    const mealPlan = await MealPlan.findById(id);
    if (!mealPlan) {
      return errorResponse(res, "Meal plan not found", 404);
    }

    const restaurant = await Restaurant.findById(mealPlan.restaurant);

    if (restaurant.owner.toString() !== req.user._id.toString()) {
      return errorResponse(res, "Not authorized to update this meal plan", 403);
    }

    // Handle weekly menu updates
    if (updateData.weeklyMenu) {
      // Parse weekly menu if it's a string
      if (typeof updateData.weeklyMenu === "string") {
        try {
          updateData.weeklyMenu = JSON.parse(updateData.weeklyMenu);
        } catch (e) {
          return errorResponse(res, "Invalid weekly menu format", 400);
        }
      }
    }

    // Handle numeric fields
    if (updateData.price) {
      updateData.price = Number(updateData.price);
    }
    if (updateData.maxSubscribers) {
      updateData.maxSubscribers = Number(updateData.maxSubscribers);
    }

    // Handle image upload
    if (req.file) {
      updateData.image = filePathToUrl(req.file.path);
    }

    const updatedMealPlan = await MealPlan.findByIdAndUpdate(id, updateData, {
      new: true,
      runValidators: true,
    });

    successResponse(res, updatedMealPlan, "Meal plan updated successfully");
  } catch (error) {
    errorResponse(res, error.message, 400);
  }
};

export const toggleMealPlanStatus = async (req, res) => {
  try {
    const { id } = req.params;

    const mealPlan = await MealPlan.findById(id);
    if (!mealPlan) {
      return errorResponse(res, "Meal plan not found", 404);
    }

    const restaurant = await Restaurant.findById(mealPlan.restaurant);
    if (restaurant.owner.toString() !== req.user._id.toString()) {
      return errorResponse(res, "Not authorized to update this meal plan", 403);
    }

    mealPlan.isActive = !mealPlan.isActive;
    await mealPlan.save();

    successResponse(
      res,
      mealPlan,
      `Meal plan ${
        mealPlan.isActive ? "activated" : "deactivated"
      } successfully`
    );
  } catch (error) {
    errorResponse(res, error.message, 400);
  }
};

export const deleteMealPlan = async (req, res) => {
  try {
    const { id } = req.params;

    const mealPlan = await MealPlan.findById(id);
    if (!mealPlan) {
      return errorResponse(res, "Meal plan not found", 404);
    }

    const restaurant = await Restaurant.findById(mealPlan.restaurant);
    if (restaurant.owner.toString() !== req.user._id.toString()) {
      return errorResponse(res, "Not authorized to delete this meal plan", 403);
    }

    // Check if meal plan has active subscriptions
    if (mealPlan.currentSubscribers > 0) {
      return errorResponse(
        res,
        "Cannot delete meal plan with active subscriptions",
        400
      );
    }

    await MealPlan.findByIdAndDelete(id);
    successResponse(res, null, "Meal plan deleted successfully");
  } catch (error) {
    errorResponse(res, error.message, 400);
  }
};
