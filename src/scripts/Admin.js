import connectDB from "../config/db.js";
import User from "../models/User.js";
import bcrypt from "bcryptjs";
import dotenv from "dotenv";

dotenv.config();

export const Admin = async () => {
  try {
    await connectDB();

    const adminExists = await User.findOne({ role: "admin" });

    if (adminExists) {
      console.log("An admin user already exists");
      process.exit(0);
    }

    // const salt = await bcrypt.genSalt(12);
    // console.log("Generated Salt:", salt);

    // const hashedPassword = await bcrypt.hash("adminpassword1", salt);
    // console.log("Hashed Password:", hashedPassword);

    const adminUser = new User({
      name: "Admin User",
      email: "admin@gmail.com",
      password: "adminpassword1",
      role: "admin",
      isEmailVerified: true,
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
