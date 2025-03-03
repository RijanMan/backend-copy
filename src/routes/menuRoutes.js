import express from "express";
import { protect, authorize } from "../middlewares/authMiddleware.js";
import { validate } from "../middlewares/validationMiddleware.js";
import { menuItemValidationRules } from "../middlewares/commonValidations.js";
import { uploadMenuImage } from "../middlewares/uploadMiddleware.js";
import {
  createMenuItem,
  getMenuItems,
  getMenuItem,
  updateMenuItem,
  deleteMenuItem,
} from "../controllers/menuController.js";

const router = express.Router();

router.post(
  "/:restaurantId",
  protect,
  authorize("vendor"),
  uploadMenuImage,
  validate(menuItemValidationRules),
  createMenuItem
);

router.get("/:restaurantId", getMenuItems);
router.get("/:restaurantId/:itemId", getMenuItem);

router.put(
  "/:restaurantId/:itemId",
  protect,
  authorize("vendor"),
  uploadMenuImage,
  validate(menuItemValidationRules),
  updateMenuItem
);

router.delete(
  "/:restaurantId/:itemId",
  protect,
  authorize("vendor"),
  deleteMenuItem
);

export default router;
