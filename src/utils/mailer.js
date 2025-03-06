import nodemailer from "nodemailer";
import dotenv from "dotenv";

dotenv.config();

// Create a transporter using SMTP settings from .env
const createTransporter = () => {
  return nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: process.env.SMTP_PORT,
    secure: process.env.SMTP_SECURE === "true",
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });
};

// Verify transporter connection
const verifyTransporter = async () => {
  try {
    const transporter = createTransporter();
    await transporter.verify();
    console.log("Email service is ready");
    return true;
  } catch (error) {
    console.error("Email service verification failed:", error);
    return false;
  }
};

// Call verification on module load
verifyTransporter();

// Function to send verification email
export const sendVerificationEmail = async (email, token) => {
  try {
    const verificationUrl = `${process.env.CLIENT_URL}/api/auth/verify-email/${token}`;
    const transporter = createTransporter();

    const mailOptions = {
      from: process.env.SMTP_FROM,
      to: email,
      subject: "Verify your email address",
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 5px;">
          <h1 style="color: #333; text-align: center;">Email Verification</h1>
          <p style="font-size: 16px; line-height: 1.5; color: #555;">Thank you for registering with DineDash. Please click the button below to verify your email address:</p>
          <div style="text-align: center; margin: 30px 0;">
            <a href="${verificationUrl}" style="background-color: #4CAF50; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; font-weight: bold;">Verify Email</a>
          </div>
          <p style="font-size: 14px; color: #777;">If the button doesn't work, you can also copy and paste the following link into your browser:</p>
          <p style="font-size: 14px; color: #777; word-break: break-all;"><a href="${verificationUrl}">${verificationUrl}</a></p>
          <p style="font-size: 14px; color: #777;">This link will expire in 24 hours.</p>
        </div>
      `,
    };

    const info = await transporter.sendMail(mailOptions);
    console.log(`Verification email sent: ${info.messageId}`);
    return info;
  } catch (error) {
    console.error("Error sending verification email:", error);
    throw error;
  }
};

export const sendPasswordResetEmail = async (email, resetUrl) => {
  try {
    const transporter = createTransporter();

    const mailOptions = {
      from: process.env.SMTP_FROM,
      to: email,
      subject: "Password Reset Request",
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 5px;">
          <h1 style="color: #333; text-align: center;">Password Reset</h1>
          <p style="font-size: 16px; line-height: 1.5; color: #555;">You requested a password reset for your DineDash account. Please click the button below to reset your password:</p>
          <div style="text-align: center; margin: 30px 0;">
            <a href="${resetUrl}" style="background-color: #4CAF50; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; font-weight: bold;">Reset Password</a>
          </div>
          <p style="font-size: 14px; color: #777;">If the button doesn't work, you can also copy and paste the following link into your browser:</p>
          <p style="font-size: 14px; color: #777; word-break: break-all;"><a href="${resetUrl}">${resetUrl}</a></p>
          <p style="font-size: 14px; color: #777;">This link will expire in 10 minutes.</p>
          <p style="font-size: 14px; color: #777;">If you didn't request a password reset, please ignore this email or contact support if you have concerns.</p>
        </div>
      `,
    };

    const info = await transporter.sendMail(mailOptions);
    console.log(`Password reset email sent: ${info.messageId}`);
    return info;
  } catch (error) {
    console.error("Error sending password reset email:", error);
    throw error;
  }
};

// New function to send order confirmation emails
export const sendOrderConfirmationEmail = async (email, order, restaurant) => {
  try {
    const transporter = createTransporter();

    // Format order items
    const itemsList = order.items
      .map(
        (item) =>
          `<tr>
        <td style="padding: 8px; border-bottom: 1px solid #ddd;">${
          item.name || "Item"
        }</td>
        <td style="padding: 8px; border-bottom: 1px solid #ddd;">${
          item.quantity
        }</td>
        <td style="padding: 8px; border-bottom: 1px solid #ddd;">$${item.price.toFixed(
          2
        )}</td>
        <td style="padding: 8px; border-bottom: 1px solid #ddd;">$${(
          item.price * item.quantity
        ).toFixed(2)}</td>
      </tr>`
      )
      .join("");

    const mailOptions = {
      from: process.env.SMTP_FROM,
      to: email,
      subject: `Your DineDash Order Confirmation #${order._id
        .toString()
        .slice(-6)}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 5px;">
          <h1 style="color: #333; text-align: center;">Order Confirmation</h1>
          <p style="font-size: 16px; line-height: 1.5; color: #555;">Thank you for your order from ${
            restaurant.name
          }!</p>
          <p style="font-size: 16px; line-height: 1.5; color: #555;">Order #: ${order._id
            .toString()
            .slice(-6)}</p>
          
          <h2 style="color: #555; margin-top: 20px;">Order Details</h2>
          <table style="width: 100%; border-collapse: collapse;">
            <thead>
              <tr style="background-color: #f2f2f2;">
                <th style="padding: 10px; text-align: left;">Item</th>
                <th style="padding: 10px; text-align: left;">Quantity</th>
                <th style="padding: 10px; text-align: left;">Price</th>
                <th style="padding: 10px; text-align: left;">Total</th>
              </tr>
            </thead>
            <tbody>
              ${itemsList}
            </tbody>
            <tfoot>
              <tr>
                <td colspan="3" style="padding: 10px; text-align: right; font-weight: bold;">Total:</td>
                <td style="padding: 10px; font-weight: bold;">$${order.totalAmount.toFixed(
                  2
                )}</td>
              </tr>
            </tfoot>
          </table>
          
          <h2 style="color: #555; margin-top: 20px;">Delivery Information</h2>
          <p style="font-size: 14px; line-height: 1.5; color: #555;">Address: ${
            order.deliveryAddress.street
          }, ${order.deliveryAddress.city}, ${order.deliveryAddress.state} ${
        order.deliveryAddress.zipCode
      }</p>
          <p style="font-size: 14px; line-height: 1.5; color: #555;">Estimated Delivery Time: ${
            order.estimatedDeliveryTime
              ? new Date(order.estimatedDeliveryTime).toLocaleString()
              : "To be determined"
          }</p>
          
          <p style="font-size: 14px; color: #777; margin-top: 30px;">Thank you for choosing DineDash. If you have any questions about your order, please contact customer support.</p>
        </div>
      `,
    };

    const info = await transporter.sendMail(mailOptions);
    console.log(`Order confirmation email sent: ${info.messageId}`);
    return info;
  } catch (error) {
    console.error("Error sending order confirmation email:", error);
    throw error;
  }
};
