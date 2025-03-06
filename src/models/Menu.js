import mongoose from "mongoose";

const menuItemSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, "Item name is required"],
    trim: true,
    minlength: [2, "Name must be at least 2 characters"],
    maxlength: [50, "Name cannot exceed 50 characters"],
  },
  description: {
    type: String,
    required: [true, "Item description is required"],
    trim: true,
    maxlength: [200, "Description cannot exceed 200 characters"],
  },
  price: {
    type: Number,
    required: [true, "Price is required"],
    min: [0, "Price cannot be negative"],
  },
  category: {
    type: String,
    required: [true, "Category is required"],
    enum: ["appetizer", "main course", "dessert", "beverage"],
  },
  mealType: {
    type: String,
    required: [true, "Meal Type is required"],
    enum: ["breakfast", "lunch", "dinner"],
  },
  dietType: {
    type: String,
    required: [true, "Diet type is required"],
    enum: ["vegan", "vegetarian", "non-vegetarian"],
  },
  image: {
    type: String,
    default: "default-food-image.jpg",
  },
  isAvailable: {
    type: Boolean,
    default: true,
  },
  allergens: [String],
  spicyLevel: {
    type: Number,
    min: 0,
    max: 5,
    default: 0,
  },
  dayAvailable: {
    type: [String],
    enum: [
      "monday",
      "tuesday",
      "wednesday",
      "thursday",
      "friday",
      "saturday",
      "sunday",
      "all",
    ],
    default: ["all"],
  },
});

const menuSchema = new mongoose.Schema(
  {
    restaurant: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Restaurant",
      required: true,
    },
    items: [menuItemSchema],
  },
  { timestamps: true }
);

const Menu = mongoose.model("Menu", menuSchema);

export default Menu;
