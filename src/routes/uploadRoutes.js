import express from "express";
import { protect } from "../middlewares/authMiddleware.js";
import {
  uploadProfileImage,
  uploadRestaurantImages,
  uploadMenuImage,
  uploadDocument,
} from "../middlewares/uploadMiddleware.js";
import {
  uploadImage as uploadImageController,
  uploadProfileImage as uploadProfileImageController,
  uploadRestaurantImages as uploadRestaurantImagesController,
  uploadMenuImage as uploadMenuImageController,
  uploadDocument as uploadDocumentController,
} from "../controllers/uploadController.js";

const router = express.Router();

// Generic file upload route
router.post("/", protect, uploadProfileImage, uploadImageController);

// Specialized upload routes
router.post(
  "/profile",
  protect,
  uploadProfileImage,
  uploadProfileImageController
);

router.post(
  "/restaurant",
  protect,
  uploadRestaurantImages,
  uploadRestaurantImagesController
);

router.post("/menu", protect, uploadMenuImage, uploadMenuImageController);

router.post("/document", protect, uploadDocument, uploadDocumentController);

export default router;
