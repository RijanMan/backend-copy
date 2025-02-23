import mongoose from "mongoose";

const orderItemSchema = new mongoose.Schema({
  menuItem: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Menu.items",
    required: true,
  },
  quantity: {
    type: Number,
    required: true,
    min: [1, "Quantity must be at least 1"],
  },
  price: {
    type: Number,
    required: true,
  },
  specialInstructions: {
    type: String,
    maxlength: [200, "Special instructions cannot exceed 200 characters"],
  },
});

const orderSchema = new mongoose.Schema(
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
    items: [orderItemSchema],
    totalAmount: {
      type: Number,
      required: true,
    },
    status: {
      type: String,
      enum: ["pending", "preparing", "on the way", "delivered", "cancelled"],
      default: "pending",
    },
    paymentMethod: {
      type: String,
      enum: ["cash", "credit card", "debit card", "online payment"],
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
    rider: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    estimatedDeliveryTime: Date,
    actualDeliveryTime: Date,
    specialInstructions: String,
    rating: {
      type: Number,
      min: 1,
      max: 5,
    },
    feedback: String,
  },
  { timestamps: true }
);

const Order = mongoose.model("Order", orderSchema);

export default Order;
