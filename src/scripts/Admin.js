import dotenv from "dotenv";
import connectDB from "../config/db.js";
import User from "../models/User.js";
import bcrypt from "bcrypt";

dotenv.config();

export const Admin = async () => {
  try {
    await connectDB();

    const adminExists = await User.findOne({ role: "admin" });

    if (adminExists) {
      console.log("An admin user already exists");
      process.exit(0);
    }

    const salt = await bcrypt.genSalt(12);
    const hashedPassword = await bcrypt.hash("adminpassword123", salt);

    const adminUser = new User({
      name: "Admin User",
      email: "admin@example.com",
      password: hashedPassword,
      role: "admin",
      isEmailVerified: true,
      adminDepartment: "operations",
      adminAccessLevel: 5,
    });

    await adminUser.save();

    console.log("Initial admin user created successfully");
    process.exit(0);
  } catch (error) {
    console.error("Error creating initial admin user:", error);
    process.exit(1);
  }
};

Admin();
