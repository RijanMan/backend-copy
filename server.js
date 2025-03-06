import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";
import connectDB from "./src/config/db.js";
import { errorHandler, notFound } from "./src/middlewares/errorMiddleware.js";

import authRoutes from "./src/routes/authRoutes.js"; // Import authRoutes
import userRoutes from "./src/routes/userRoutes.js"; // Import userRoutes
import restaurantRoutes from "./src/routes/restaurantRoutes.js"; // Import restaurantRoutes
import menuRoutes from "./src/routes/menuRoutes.js"; // Import menuRoutes
import orderRoutes from "./src/routes/orderRoutes.js"; // Import orderRoutes
import mealPlanRoutes from "./src/routes/mealPlanRoutes.js"; // Import mealPlanRoutes
import subscriptionRoutes from "./src/routes/subscriptionRoutes.js"; // Import subscriptionRoutes
import reviewRoutes from "./src/routes/reviewRoutes.js"; // Import reviewRoutes
import paymentRoutes from "./src/routes/paymentRoutes.js"; // Import paymentRoutes.js
import notificationRoutes from "./src/routes/notificationRoutes.js"; //Import notificationRoutes
import riderRoutes from "./src/routes/riderRoutes.js"; // Import riderRoutes
import adminRoutes from "./src/routes/adminRoutes.js"; // Import adminRoutes
import uploadRoutes from "./src/routes/uploadRoutes.js";
import { apiLimiter } from "./src/middlewares/rateLimitMiddleware.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config();

connectDB();

const app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Add rate limiting middleware
app.use("/api/", apiLimiter);

// Configure static file serving directly
const uploadsPath = path.join(__dirname, "../uploads");
app.use("/uploads", express.static(uploadsPath));

// Test route
app.get("/", (req, res) => {
  res.send({ message: "Hello from DineDash Server!" });
});

// Routes
app.use("/api/auth", authRoutes);
app.use("/api/users", userRoutes);
app.use("/api/restaurants", restaurantRoutes);
app.use("/api/menus", menuRoutes);
app.use("/api/orders", orderRoutes);
app.use("/api/meal-plans", mealPlanRoutes);
app.use("/api/subscriptions", subscriptionRoutes);
app.use("/api/reviews", reviewRoutes);
app.use("/api/payments", paymentRoutes);
app.use("/api/notifications", notificationRoutes);
app.use("/api/riders", riderRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/upload", uploadRoutes);

app.use(notFound);
app.use(errorHandler);

// Start the server
const PORT = process.env.PORT || 5000;

app.listen(PORT, async () => {
  console.log(`Server started on http://localhost:${PORT}`);
});
