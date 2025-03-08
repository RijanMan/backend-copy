import mongoose from "mongoose";

const customizationRequestSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    restaurant: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Restaurant",
      required: true,
    },
    dietaryPreferences: {
      type: [String],
      enum: ["vegetarian", "vegan", "non-vegetarian"],
      required: true,
    },
    allergies: {
      type: [String],
      default: [],
    },
    mealTimes: {
      type: [String],
      enum: ["morning", "evening", "both"],
      required: true,
    },
    additionalRequirements: {
      type: String,
      maxlength: [500, "Additional requirements cannot exceed 500 characters"],
    },
    caloriePreference: {
      type: String,
      enum: ["low", "medium", "high", "none"],
      default: "none",
    },
    status: {
      type: String,
      enum: ["pending", "approved", "rejected", "completed"],
      default: "pending",
    },
    rejectionReason: {
      type: String,
    },
    resultingMealPlan: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "MealPlan",
      default: null,
    },
  },
  { timestamps: true }
);

const CustomizationRequest = mongoose.model(
  "CustomizationRequest",
  customizationRequestSchema
);

export default CustomizationRequest;
