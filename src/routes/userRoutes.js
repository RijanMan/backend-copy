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
  ]),
  updateUserProfile
);

router.get("/", protect, authorize("admin"), getAllUsers);
router.get("/:id", protect, authorize("admin"), getUserById);
router.delete("/:id", protect, authorize("admin"), deleteUser);

export default router;
