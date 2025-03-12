import nodemailer from "nodemailer";
import dotenv from "dotenv";

dotenv.config();

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

verifyTransporter();

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

export const sendOrderConfirmationEmail = async (email, order, restaurant) => {
  try {
    const transporter = createTransporter();

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

export const sendRestaurantOrderNotificationEmail = async (
  vendorEmail,
  order,
  customer,
  restaurant
) => {
  try {
    const transporter = createTransporter();

    const itemsList = order.items
      .map(
        (item) =>
          `<tr>
        <td style="padding: 8px; border-bottom: 1px solid #ddd;">${
          item.name || "Unknown Item"
        }</td>
        <td style="padding: 8px; border-bottom: 1px solid #ddd;">${
          item.quantity
        }</td>
        <td style="padding: 8px; border-bottom: 1px solid #ddd;">$${
          item.price ? item.price.toFixed(2) : "0.00"
        }</td>
        <td style="padding: 8px; border-bottom: 1px solid #ddd;">$${
          item.price && item.quantity
            ? (item.price * item.quantity).toFixed(2)
            : "0.00"
        }</td>
      </tr>`
      )
      .join("");

    const specialRequests = order.specialRequests
      ? `<p style="font-size: 14px; line-height: 1.5; color: #555;"><strong>Special Requests:</strong> ${order.specialRequests}</p>`
      : "";

    const deliveryInstructions = order.deliveryInstructions
      ? `<p style="font-size: 14px; line-height: 1.5; color: #555;"><strong>Delivery Instructions:</strong> ${order.deliveryInstructions}</p>`
      : "";

    const mailOptions = {
      from: process.env.SMTP_FROM,
      to: vendorEmail,
      subject: `New Order Received #${order._id.toString().slice(-6)}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 5px;">
          <h1 style="color: #333; text-align: center;">New Order Received</h1>
          <div style="background-color: #f5f5f5; padding: 15px; border-radius: 5px; margin-bottom: 20px;">
            <h2 style="color: #4CAF50; margin-top: 0;">Order #${order._id
              .toString()
              .slice(-6)}</h2>
            <p style="font-size: 16px; margin: 5px 0;"><strong>Time:</strong> ${new Date(
              order.createdAt
            ).toLocaleString()}</p>
            <p style="font-size: 16px; margin: 5px 0;"><strong>Customer:</strong> ${
              customer.name
            }</p>
            <p style="font-size: 16px; margin: 5px 0;"><strong>Phone:</strong> ${
              customer.phone || "Not provided"
            }</p>
          </div>
          
          <h2 style="color: #555;">Order Details</h2>
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
          
          ${specialRequests}
          
          <h2 style="color: #555; margin-top: 20px;">Delivery Information</h2>
          <p style="font-size: 14px; line-height: 1.5; color: #555;"><strong>Address:</strong> ${
            order.deliveryAddress.street
          }, ${order.deliveryAddress.city}, ${order.deliveryAddress.state} ${
        order.deliveryAddress.zipCode
      }</p>
          ${deliveryInstructions}
          
          <div style="text-align: center; margin: 30px 0;">
            <a href="${process.env.CLIENT_URL}/vendor/orders/${
        order._id
      }" style="background-color: #4CAF50; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; font-weight: bold;">View Order Details</a>
          </div>
          
          <p style="font-size: 14px; color: #777; margin-top: 30px;">Please update the order status as you process it. Thank you for using DineDash!</p>
        </div>
      `,
    };

    const info = await transporter.sendMail(mailOptions);
    console.log(`Restaurant order notification email sent: ${info.messageId}`);
    return info;
  } catch (error) {
    console.error("Error sending restaurant order notification email:", error);
    throw error;
  }
};

export const sendSubscriptionReminderEmail = async (
  email,
  userName,
  mealPlanName,
  renewalDate
) => {
  try {
    const transporter = createTransporter();

    const formattedRenewalDate = new Date(renewalDate).toLocaleDateString(
      "en-US",
      {
        year: "numeric",
        month: "long",
        day: "numeric",
      }
    );

    const mailOptions = {
      from: process.env.SMTP_FROM,
      to: email,
      subject: "Your DineDash Subscription Renewal Reminder",
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 5px;">
          <h1 style="color: #333; text-align: center;">Subscription Renewal Reminder</h1>
          <p style="font-size: 16px; line-height: 1.5; color: #555;">Hello ${userName},</p>
          <p style="font-size: 16px; line-height: 1.5; color: #555;">This is a friendly reminder that your subscription to <strong>${mealPlanName}</strong> will renew on <strong>${formattedRenewalDate}</strong>.</p>
          
          <div style="background-color: #f9f9f9; padding: 15px; border-radius: 5px; margin: 20px 0;">
            <p style="font-size: 14px; color: #555; margin: 0;">Please ensure your payment method is up to date to avoid any interruption in your meal delivery service.</p>
          </div>
          
          <div style="text-align: center; margin: 30px 0;">
            <a href="${process.env.CLIENT_URL}/subscriptions" style="background-color: #4CAF50; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; font-weight: bold;">Manage Your Subscription</a>
          </div>
          
          <p style="font-size: 14px; color: #777;">If you wish to make any changes to your subscription or have any questions, please visit your account dashboard or contact our customer support team.</p>
          
          <p style="font-size: 14px; color: #777; margin-top: 30px;">Thank you for choosing DineDash for your meal subscription needs!</p>
        </div>
      `,
    };

    const info = await transporter.sendMail(mailOptions);
    console.log(`Subscription reminder email sent: ${info.messageId}`);
    return info;
  } catch (error) {
    console.error("Error sending subscription reminder email:", error);
    throw error;
  }
};

export const sendCustomizationRequestApprovedEmail = async (
  email,
  userName,
  restaurantName
) => {
  try {
    const transporter = createTransporter();

    const mailOptions = {
      from: process.env.SMTP_FROM,
      to: email,
      subject: "Your Meal Plan Customization Request Has Been Approved",
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 5px;">
          <h1 style="color: #333; text-align: center;">Customization Request Approved</h1>
          <p style="font-size: 16px; line-height: 1.5; color: #555;">Hello ${userName},</p>
          <p style="font-size: 16px; line-height: 1.5; color: #555;">Great news! <strong>${restaurantName}</strong> has approved your meal plan customization request.</p>
          
          <div style="background-color: #f9f9f9; padding: 15px; border-radius: 5px; margin: 20px 0;">
            <p style="font-size: 14px; color: #555; margin: 0;">The restaurant will now create a custom meal plan based on your preferences. You'll receive another notification when your custom meal plan is ready.</p>
          </div>
          
          <div style="text-align: center; margin: 30px 0;">
            <a href="${process.env.CLIENT_URL}/customization-requests" style="background-color: #4CAF50; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; font-weight: bold;">View Request Status</a>
          </div>
          
          <p style="font-size: 14px; color: #777;">If you have any questions about your customization request, please contact our customer support team.</p>
          
          <p style="font-size: 14px; color: #777; margin-top: 30px;">Thank you for choosing DineDash for your personalized meal needs!</p>
        </div>
      `,
    };

    const info = await transporter.sendMail(mailOptions);
    console.log(`Customization request approved email sent: ${info.messageId}`);
    return info;
  } catch (error) {
    console.error("Error sending customization request approved email:", error);
    throw error;
  }
};

export const sendCustomMealPlanCreatedEmail = async (
  email,
  userName,
  restaurantName,
  mealPlanName
) => {
  try {
    const transporter = createTransporter();

    const mailOptions = {
      from: process.env.SMTP_FROM,
      to: email,
      subject: "Your Custom Meal Plan is Ready",
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 5px;">
          <h1 style="color: #333; text-align: center;">Custom Meal Plan Ready</h1>
          <p style="font-size: 16px; line-height: 1.5; color: #555;">Hello ${userName},</p>
          <p style="font-size: 16px; line-height: 1.5; color: #555;"><strong>${restaurantName}</strong> has created your custom meal plan: <strong>${mealPlanName}</strong>.</p>
          
          <div style="background-color: #f9f9f9; padding: 15px; border-radius: 5px; margin: 20px 0;">
            <p style="font-size: 14px; color: #555; margin: 0;">Your custom meal plan has been tailored to your preferences and dietary requirements. You can now subscribe to this meal plan to start receiving your personalized meals.</p>
          </div>
          
          <div style="text-align: center; margin: 30px 0;">
            <a href="${process.env.CLIENT_URL}/meal-plans/custom" style="background-color: #4CAF50; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; font-weight: bold;">View Your Custom Meal Plan</a>
          </div>
          
          <p style="font-size: 14px; color: #777;">If you have any questions about your custom meal plan, please contact our customer support team.</p>
          
          <p style="font-size: 14px; color: #777; margin-top: 30px;">Thank you for choosing DineDash for your personalized meal needs!</p>
        </div>
      `,
    };

    const info = await transporter.sendMail(mailOptions);
    console.log(`Custom meal plan created email sent: ${info.messageId}`);
    return info;
  } catch (error) {
    console.error("Error sending custom meal plan created email:", error);
    throw error;
  }
};

export const sendCustomizationRequestEmail = async (
  email,
  vendorName,
  userName,
  restaurantName
) => {
  try {
    const transporter = createTransporter();

    const mailOptions = {
      from: process.env.SMTP_FROM,
      to: email,
      subject: "New Meal Plan Customization Request",
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 5px;">
          <h1 style="color: #333; text-align: center;">New Customization Request</h1>
          <p style="font-size: 16px; line-height: 1.5; color: #555;">Hello ${vendorName},</p>
          <p style="font-size: 16px; line-height: 1.5; color: #555;">You have received a new meal plan customization request from <strong>${userName}</strong> for your restaurant <strong>${restaurantName}</strong>.</p>
          
          <div style="background-color: #f9f9f9; padding: 15px; border-radius: 5px; margin: 20px 0;">
            <p style="font-size: 14px; color: #555; margin: 0;">Please review this request at your earliest convenience and either approve or reject it based on your capacity and the customer's requirements.</p>
          </div>
          
          <div style="text-align: center; margin: 30px 0;">
            <a href="${process.env.CLIENT_URL}/vendor/customization-requests" style="background-color: #4CAF50; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; font-weight: bold;">View Customization Requests</a>
          </div>
          
          <p style="font-size: 14px; color: #777;">If you have any questions, please contact our support team.</p>
          
          <p style="font-size: 14px; color: #777; margin-top: 30px;">Thank you for being a valued partner with DineDash!</p>
        </div>
      `,
    };

    const info = await transporter.sendMail(mailOptions);
    console.log(`Customization request email sent: ${info.messageId}`);
    return info;
  } catch (error) {
    console.error("Error sending customization request email:", error);
    throw error;
  }
};

export const sendCustomizationRequestRejectedEmail = async (
  email,
  userName,
  restaurantName,
  rejectionReason
) => {
  try {
    const transporter = createTransporter();

    const mailOptions = {
      from: process.env.SMTP_FROM,
      to: email,
      subject: "Your Meal Plan Customization Request Has Been Rejected",
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 5px;">
          <h1 style="color: #333; text-align: center;">Customization Request Rejected</h1>
          <p style="font-size: 16px; line-height: 1.5; color: #555;">Hello ${userName},</p>
          <p style="font-size: 16px; line-height: 1.5; color: #555;">We regret to inform you that <strong>${restaurantName}</strong> has rejected your meal plan customization request.</p>
          
          <div style="background-color: #f9f9f9; padding: 15px; border-radius: 5px; margin: 20px 0;">
            <p style="font-size: 14px; color: #555; margin: 0;"><strong>Reason for rejection:</strong> ${rejectionReason}</p>
          </div>
          
          <div style="text-align: center; margin: 30px 0;">
            <a href="${process.env.CLIENT_URL}/customization-requests" style="background-color: #4CAF50; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; font-weight: bold;">View Request Status</a>
          </div>
          
          <p style="font-size: 14px; color: #777;">You may want to try submitting a new request with adjusted requirements or try another restaurant that might better accommodate your needs.</p>
          
          <p style="font-size: 14px; color: #777; margin-top: 30px;">Thank you for choosing DineDash!</p>
        </div>
      `,
    };

    const info = await transporter.sendMail(mailOptions);
    console.log(`Customization request rejected email sent: ${info.messageId}`);
    return info;
  } catch (error) {
    console.error("Error sending customization request rejected email:", error);
    throw error;
  }
};
