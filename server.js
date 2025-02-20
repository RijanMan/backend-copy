import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import connectDB from "./src/config/db.js";
import authRoutes from "./src/routes/authRoutes.js"; // Import authRoutes
import restaurantRoutes from "./src/routes/restaurantRoutes.js"; // Import restaurantRoutes

dotenv.config();

// Connect to MongoDB first (ensures DB is ready before handling requests)
connectDB();

const app = express();

// Middleware
app.use(express.json());
app.use(cors());

// Routes
app.use("/api/auth", authRoutes);
app.use("/api/restaurants", restaurantRoutes);

// Test route
app.get("/", (req, res) => {
  res.json({ message: "Hello from DineDash Server!" });
});

// Start the server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server started on http://localhost:${PORT}`);
});
