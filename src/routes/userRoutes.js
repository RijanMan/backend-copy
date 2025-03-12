import express from "express";
import { body } from "express-validator";
import { protect, authorize } from "../middlewares/authMiddleware.js";
import { validate } from "../middlewares/validationMiddleware.js";
import { uploadProfileImage } from "../middlewares/uploadMiddleware.js";
import {
  getUserProfile,
  updateUserProfile,
  getAllUsers,
  getUserById,
  deleteUser,
  addFavoriteRestaurant,
  removeFavoriteRestaurant,
} from "../controllers/userController.js";

const router = express.Router();

router.get("/profile", protect, getUserProfile);

router.put(
  "/profile",
  protect,
  uploadProfileImage,
  validate([
    body("name").optional().trim().isLength({ min: 2, max: 50 }),
    body("email").optional().isEmail(),
    body("password").optional().isLength({ min: 8 }),
    body("address").optional().isObject(),
    body("phoneNumber").optional().isMobilePhone(),
    body("address").optional().isObject(),

    // Role-specific field validation
    body("role").optional().isIn(["admin", "user", "vendor", "rider"]),
    //vendor spicific
    body("RestaurantName")
      .optional()
      .isString()
      .if(body("role").equals("vendor")),
    body("ownedRestaurants")
      .optional()
      .isString()
      .if(body("role").equals("vendor")),

    //Rider spicific
    body("isAvaailable")
      .optional()
      .isBoolean()
      .if(body("role").equals("rider")),
    body("licenseNumber")
      .optional()
      .isString()
      .if(body("role").equals("rider")),

    // Customer-specific fields (preferences)
    body("dietaryPreference")
      .optional()
      .isIn(["vegetarian", "vegan", "non-vegetarian"])
      .if(body("role").equals("user")),
    body("allergies").optional().isString().if(body("role").equals("user")),
  ]),
  updateUserProfile
);

router.post(
  "/favorites",
  protect,
  validate([body("restaurantId").isMongoId()]),
  addFavoriteRestaurant
);

router.delete("/favorites/:restaurantId", protect, removeFavoriteRestaurant);

router.get("/", protect, authorize("admin"), getAllUsers);

router.get("/:id", protect, authorize("admin"), getUserById);

router.delete("/:id", protect, authorize("admin"), deleteUser);

export default router;
