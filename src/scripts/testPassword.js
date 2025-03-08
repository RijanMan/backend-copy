import bcrypt from "bcryptjs";
import connectDB from "../config/db.js";
import User from "../models/User.js";

const testAdminPassword = async () => {
  try {
    await connectDB();

    const admin = await User.findOne({ email: "admin@gmail.com" }).select(
      "+password"
    );

    if (!admin) {
      console.log("Admin user not found");
      process.exit(1);
    }

    console.log("Stored Hashed Password:", admin.password);

    const isMatch = await bcrypt.compare("adminpassword1", admin.password);
    console.log("Password Match:", isMatch ? "Yes" : "No");

    process.exit(0);
  } catch (error) {
    console.error("Error:", error);
    process.exit(1);
  }
};

testAdminPassword();
