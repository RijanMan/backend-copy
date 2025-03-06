import mongoose from "mongoose";

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
      minlength: [2, "Name must be at least 2 characters"],
      maxlength: [50, "Name cannot exceed 50 characters"],
    },
    description: {
      type: String,
      required: [true, "Meal plan description is required"],
      trim: true,
      maxlength: [500, "Description cannot exceed 500 characters"],
    },
    duration: {
      type: String,
      enum: ["weekly", "monthly"],
      required: [true, "Duration is required"],
    },
    price: {
      type: Number,
      required: [true, "Price is required"],
      min: [0, "Price cannot be negative"],
    },
    mealType: {
      type: String,
      enum: ["breakfast", "lunch", "dinner", "full-day"],
      required: [true, "Meal type is required"],
    },
    mealTime: {
      type: String,
      required: [true, "Meal delivery time is required"],
    },
    dietaryOptions: {
      type: String,
      enum: ["vegetarian", "vegan", "non-vegetarian"],
      default: "vegetarian",
      required: [true, "Dietary option is required"],
    },
    portionSize: {
      type: String,
      enum: ["small", "medium", "large"],
      default: "medium",
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    availableDays: {
      type: [String],
      enum: [
        "monday",
        "tuesday",
        "wednesday",
        "thursday",
        "friday",
        "saturday",
        "sunday",
      ],
      default: ["monday", "tuesday", "wednesday", "thursday", "friday"],
    },

    maxSubscribers: {
      type: Number,
      min: 1,
    },
    currentSubscribers: {
      type: Number,
      default: 0,
    },
  },
  { timestamps: true }
);

const MealPlan = mongoose.model("MealPlan", mealPlanSchema);

export default MealPlan;
