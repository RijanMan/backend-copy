import dotenv from "dotenv";
import connectDB from "../config/db.js";
import User from "../models/User.js";

dotenv.config();

export const createAdminUser = async () => {
  try {
    await connectDB();

    const adminUser = await User.findOne({ role: "admin" });

    if (adminUser) {
      console.log("Admin user already exists");
      process.exit(0);
    }

    const newAdminUser = new User({
      name: "Admin User",
      email: "admin@example.com",
      password: "adminpassword123",
      role: "admin",
      isEmailVerified: true,
    });

    await newAdminUser.save();

    console.log("Admin user created successfully");
    process.exit(0);
  } catch (error) {
    console.error("Error creating admin user:", error);
    process.exit(1);
  }
};
