import mongoose from "mongoose";
import bcrypt from "bcrypt";
import crypto from "crypto";

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Please add a name"],
      trim: true,
      minlength: [2, "Name must be at least 2 characters"],
      maxlength: [50, "Name cannot exceed 50 characters"],
    },
    email: {
      type: String,
      required: [true, "Please add an email"],
      unique: true,
      lowercase: true,
      trim: true,
      match: [
        /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/,
        "Please add a valid email",
      ],
    },
    password: {
      type: String,
      required: [true, "Please add a password"],
      minlength: [8, "Password must be at least 8 characters"],
      select: false,
    },
    role: {
      type: String,
      enum: ["user", "vendor", "rider", "admin"],
      default: "user",
    },
    isEmailVerified: {
      type: Boolean,
      default: false,
    },

    isActive: {
      type: Boolean,
      default: true,
    },

    verificationToken: String,
    verificationTokenExpires: Date,
    resetPasswordToken: String,
    resetPasswordExpires: Date,
    address: {
      street: String,
      city: String,
      state: String,
      zipCode: String,
    },
    phoneNumber: {
      type: String,
      match: [/^\+?[\d\s-]{10,}$/, "Please add a valid phone number"],
    },
    profilePicture: {
      type: String,
      default: "default-profile.jpg",
    },

    // Rider Specific Fields
    isAvailable: {
      type: Boolean,
      default: false,
    },
    licenseNumber: String,

    totalEarnings: {
      type: Number,
      default: 0,
    },

    //Vendor Specific fiels
    RestaurantName: {
      type: String,
    },
    ownedRestaurants: [
      { type: mongoose.Schema.Types.ObjectId, ref: "Restaurant" },
    ],

    // User preferences

    dietaryPreference: {
      type: String,
      enum: ["vegetarian", "vegan", "non-vegetarian"],
      default: "non-vegetarian",
    },
    allergies: [String],

    favoriteRestaurants: [
      { type: mongoose.Schema.Types.ObjectId, ref: "Restaurant" },
    ],

    // Login tracking
    lastLogin: Date,
    loginHistory: [
      {
        timestamp: Date,
        ipAddress: String,
        userAgent: String,
      },
    ],
  },
  { timestamps: true }
);

// Hash password before saving
userSchema.pre("save", async function (next) {
  if (!this.isModified("password")) return next();
  try {
    const salt = await bcrypt.genSalt(12);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});

// Compare password
userSchema.methods.matchPassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

// Generate verification token
userSchema.methods.generateVerificationToken = function () {
  const verificationToken = crypto.randomBytes(32).toString("hex");
  this.verificationToken = crypto
    .createHash("sha256")
    .update(verificationToken)
    .digest("hex");
  this.verificationTokenExpires = Date.now() + 24 * 60 * 60 * 1000; // 24 hours
  return verificationToken;
};

// Generate password reset token
userSchema.methods.generatePasswordResetToken = function () {
  const resetToken = crypto.randomBytes(20).toString("hex");
  this.resetPasswordToken = crypto
    .createHash("sha256")
    .update(resetToken)
    .digest("hex");
  this.resetPasswordExpires = Date.now() + 10 * 60 * 1000; // 10 minutes
  return resetToken;
};

userSchema.methods.trackLogin = async function (ipAddress, userAgent) {
  this.lastLogin = new Date();
  return this.save();
};

const User = mongoose.model("User", userSchema);

export default User;
