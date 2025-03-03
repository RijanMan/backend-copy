import MealPlan from "../models/MealPlan.js";
import Restaurant from "../models/Restaurant.js";
import { successResponse, errorResponse } from "../utils/responseHandler.js";

export const createMealPlan = async (req, res) => {
  try {
    const { restaurantId } = req.params;
    const mealPlanData = req.body;

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

    if (req.file) {
      mealPlanData.image = `/uploads/meal-plans/${req.file.filename}`;
    }

    const mealPlan = new MealPlan({
      ...mealPlanData,
      restaurant: restaurantId,
    });

    await mealPlan.save();
    successResponse(res, mealPlan, "Meal plan created successfully", 201);
  } catch (error) {
    errorResponse(res, error.message, 400);
  }
};

export const getMealPlans = async (req, res) => {
  try {
    const { restaurantId } = req.params;
    const { isActive } = req.query;

    const query = { restaurant: restaurantId };
    if (isActive !== undefined) {
      query.isActive = isActive === "true";
    }

    const mealPlans = await MealPlan.find(query).populate("menuItems");
    successResponse(res, mealPlans, "Meal plans retrieved successfully");
  } catch (error) {
    errorResponse(res, error.message, 400);
  }
};

export const getMealPlan = async (req, res) => {
  try {
    const { id } = req.params;
    const mealPlan = await MealPlan.findById(id).populate("menuItems");

    if (!mealPlan) {
      return errorResponse(res, "Meal plan not found", 404);
    }

    successResponse(res, mealPlan, "Meal plan retrieved successfully");
  } catch (error) {
    errorResponse(res, error.message, 400);
  }
};

export const updateMealPlan = async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body;

    const mealPlan = await MealPlan.findById(id);
    if (!mealPlan) {
      return errorResponse(res, "Meal plan not found", 404);
    }

    const restaurant = await Restaurant.findById(mealPlan.restaurant);
    if (restaurant.owner.toString() !== req.user._id.toString()) {
      return errorResponse(res, "Not authorized to update this meal plan", 403);
    }

    if (req.file) {
      updateData.image = `/uploads/meal-plans/${req.file.filename}`;
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

    await MealPlan.findByIdAndDelete(id);
    successResponse(res, null, "Meal plan deleted successfully");
  } catch (error) {
    errorResponse(res, error.message, 400);
  }
};
