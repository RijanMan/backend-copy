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
  updateUserPreferences,
  addFavoriteRestaurant,
  removeFavoriteRestaurant,
  getUserPreferences,
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
    body("preferences").optional().isObject().if(body("role").equals("user")),
    body("preferences.dietaryRestrictions")
      .optional()
      .isArray()
      .if(body("role").equals("user")),
    body("preferences.favoriteCuisines")
      .optional()
      .isArray()
      .if(body("role").equals("user")),
    body("preferences.spicyPreference")
      .optional()
      .isInt({ min: 0, max: 5 })
      .withMessage("Spicy preference must be between 0 and 5")
      .if(body("role").equals("user")),
  ]),
  updateUserProfile
);

router.put(
  "/preferences",
  protect,
  validate([
    body("dietaryRestrictions").optional().isArray(),
    body("favoriteCuisines").optional().isArray(),
    body("spicyPreference").optional().isInt({ min: 0, max: 5 }),
  ]),
  updateUserPreferences
);

router.post(
  "/favorites",
  protect,
  validate([body("restaurantId").isMongoId()]),
  addFavoriteRestaurant
);

router.delete("/favorites/:restaurantId", protect, removeFavoriteRestaurant);

router.get("/preferences", protect, getUserPreferences);

router.get("/", protect, authorize("admin"), getAllUsers);
router.get("/:id", protect, authorize("admin"), getUserById);
router.delete("/:id", protect, authorize("admin"), deleteUser);

export default router;
