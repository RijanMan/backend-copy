import mongoose from "mongoose";

const dailyMenuItemSchema = new mongoose.Schema({
  itemId: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
  },
  name: {
    type: String,
    required: true,
  },
  description: {
    type: String,
    required: true,
  },
  price: {
    type: Number,
    required: true,
  },
});

const dailyMenuSchema = new mongoose.Schema({
  day: {
    type: String,
    enum: ["sunday", "monday", "tuesday", "wednesday", "thursday", "friday"],
    required: true,
  },
  vegItems: [dailyMenuItemSchema],
  nonVegItems: [dailyMenuItemSchema],
  veganItems: [dailyMenuItemSchema],
});

const mealPlanSchema = new mongoose.Schema(
  {
    restaurant: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Restaurant",
      required: true,
    },
    name: {
      type: String,
      required: [true, "Meal plan name is required"],
      trim: true,
      maxlength: [100, "Name cannot exceed 100 characters"],
    },
    description: {
      type: String,
      required: [true, "Description is required"],
      trim: true,
      maxlength: [500, "Description cannot exceed 500 characters"],
    },
    tier: {
      type: String,
      required: true,
      enum: ["regular", "custom", "business"],
    },
    weeklyMenu: [dailyMenuSchema],
    price: {
      type: Number,
      required: [true, "Price is required"],
      min: [0, "Price cannot be negative"],
    },
    duration: {
      type: String,
      required: true,
      enum: ["weekly", "monthly"],
      default: "weekly",
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    maxSubscribers: {
      type: Number,
      min: 0,
    },
    currentSubscribers: {
      type: Number,
      default: 0,
    },
    image: {
      type: String,
      default: "default-meal-plan.jpg",
    },
    // For custom tier meal plans
    isCustom: {
      type: Boolean,
      default: false,
    },
    customFor: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
    customizationRequest: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "CustomizationRequest",
      default: null,
    },
  },
  { timestamps: true }
);

const MealPlan = mongoose.model("MealPlan", mealPlanSchema);

export default MealPlan;
