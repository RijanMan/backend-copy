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
    selectedMealOptions: [
      {
        type: String,
        enum: ["morning", "evening"],
        required: true,
      },
    ],
    dietaryPreferences: [
      {
        type: String,
        enum: ["vegetarian", "vegan", "lactose-free", "gluten-free"],
      },
    ],
    allergies: [String],
    customizations: {
      type: Map,
      of: String,
      default: {},
    },
    status: {
      type: String,
      enum: ["active", "paused", "cancelled", "completed"],
      default: "active",
    },
    renewalDate: {
      type: Date,
    },
    paymentMethod: {
      type: String,
      enum: ["credit card", "debit card", "online payment"],
      required: true,
    },
    paymentStatus: {
      type: String,
      enum: ["pending", "completed", "failed"],
      default: "pending",
    },
    deliveryAddress: {
      street: { type: String, required: true },
      city: { type: String, required: true },
      state: { type: String, required: true },
      zipCode: { type: String, required: true },
    },
    deliveryInstructions: String,
    totalAmount: {
      type: Number,
      required: true,
      min: [0, "Amount cannot be negative"],
    },
  },
  { timestamps: true }
);

const Subscription = mongoose.model("Subscription", subscriptionSchema);

export default Subscription;
