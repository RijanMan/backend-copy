import nodemailer from "nodemailer";
import dotenv from "dotenv";

// Load environment variables
dotenv.config();

// Create a transporter using SMTP settings from .env
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: process.env.SMTP_PORT,
  secure: process.env.SMTP_SECURE === "true", // Convert string to boolean
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

// Function to send verification email
export const sendVerificationEmail = async (email, token) => {
  // Ensure CLIENT_URL is valid (no leading/trailing spaces)
  const verificationUrl = `${process.env.CLIENT_URL}/api/auth/verify-email/${token}`;

  const mailOptions = {
    from: process.env.SMTP_FROM,
    to: email,
    subject: "Verify your email address",
    html: `
      <h1>Email Verification</h1>
      <p>Please click the link below to verify your email address:</p>
      <a href="${verificationUrl}">${verificationUrl}</a>
      <p>This link will expire in 24 hours.</p>
    `,
  };

  try {
    // Send email using the transporter
    await transporter.sendMail(mailOptions);
  } catch (error) {
    // Log and throw error if email fails to send
    throw new Error("Error sending email");
  }
};

export const sendPasswordResetEmail = async (email, resetUrl) => {
  const mailOptions = {
    from: process.env.SMTP_FROM,
    to: email,
    subject: "Password Reset Request",
    html: `
      <h1>Password Reset</h1>
      <p>Please click the link below to reset your password:</p>
      <a href="${resetUrl}">${resetUrl}</a>
      <p>This link will expire in 10 minutes.</p>
    `,
  };

  await transporter.sendMail(mailOptions);
};
