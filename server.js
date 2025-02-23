import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";
import connectDB from "./src/config/db.js";
import authRoutes from "./src/routes/authRoutes.js"; // Import authRoutes
import restaurantRoutes from "./src/routes/restaurantRoutes.js"; // Import restaurantRoutes
import userRoutes from "./src/routes/userRoutes.js"; // Import userRoutes
import menuRoutes from "./src/routes/menuRoutes.js"; // Import menuRoutes
import { apiLimiter } from "./src/middlewares/rateLimitMiddleware.js";

dotenv.config();

// Connect to MongoDB first (ensures DB is ready before handling requests)
connectDB();

const app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Add rate limiting middleware
app.use("/api/", apiLimiter);

// Serve static assets in production
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
app.use("/uploads", express.static(path.join(__dirname, "../uploads")));

// Routes
app.use("/api/auth", authRoutes);
app.use("/api/users", userRoutes);
app.use("/api/restaurants", restaurantRoutes);
app.use("/api/menus", menuRoutes);

// Test route
app.get("/", (req, res) => {
  res.json({ message: "Hello from DineDash Server!" });
});

// Start the server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server started on http://localhost:${PORT}`);
});
