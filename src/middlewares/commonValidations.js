import { body } from "express-validator";

export const userValidationRules = [
  body("name").notEmpty().withMessage("Name is required"),
  body("email").isEmail().withMessage("Please enter a valid email"),
  body("password")
    .isLength({ min: 8 })
    .withMessage("Password must be at least 8 characters"),
];

export const restaurantValidationRules = [
  body("name").notEmpty().withMessage("Restaurant name is required"),
  body("cuisine").notEmpty().withMessage("Cuisine type is required"),
  body("address.street").notEmpty().withMessage("Street address is required"),
  body("address.city").notEmpty().withMessage("City is required"),
  body("address.state").notEmpty().withMessage("State is required"),
  body("address.zipCode").notEmpty().withMessage("Zip code is required"),
  body("phone").notEmpty().withMessage("Phone number is required"),
  // body("images").custom((value, { req }) => {
  //   if (!req.files || req.files.length === 0) {
  //     throw new Error("At least one image is required");
  //   }
  //   return true;
  // }),
];

export const menuItemValidationRules = [
  body("name").notEmpty().withMessage("Item name is required"),
  body("description").notEmpty().withMessage("Item description is required"),
  body("price").isNumeric().withMessage("Price must be a number"),
  body("category")
    .isIn(["appetizer", "main course", "dessert", "beverage"])
    .withMessage("Invalid category"),
  body("isAvailable")
    .optional()
    .isBoolean()
    .withMessage("isAvailable must be a boolean"),
  body("allergens")
    .optional()
    .isArray()
    .withMessage("Allergens must be an array"),
  body("spicyLevel")
    .optional()
    .isInt({ min: 0, max: 5 })
    .withMessage("Spicy level must be between 0 and 5"),
  body("preparationTime")
    .optional()
    .isInt({ min: 0 })
    .withMessage("Preparation time must be a positive integer"),
    
];
