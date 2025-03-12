import mongoose from "mongoose";

const subscriptionSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    mealPlan: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "MealPlan",
      required: true,
    },
    startDate: {
      type: Date,
      required: true,
    },
    endDate: {
      type: Date,
      required: true,
    },
    renewalDate: {
      type: Date,
      required: true,
    },
    selectedDietType: {
      type: String,
      enum: ["vegetarian", "vegan", "non-vegetarian"],
      required: true,
    },
    selectedMealTimes: {
      type: [String],
      enum: ["morning", "evening", "both"],
      required: true,
    },

    deliveryAddress: {
      street: { type: String, required: true },
      city: { type: String, required: true },
      state: { type: String, required: true },
      zipCode: { type: String, required: true },
    },
    deliveryInstructions: String,
    paymentMethod: {
      type: String,
      enum: ["online"],
      required: true,
    },
    status: {
      type: String,
      enum: ["pending", "active", "cancelled"],
      default: "pending",
    },
    totalAmount: {
      type: Number,
      required: true,
    },
  },
  { timestamps: true }
);

const Subscription = mongoose.model("Subscription", subscriptionSchema);

export default Subscription;
