import CustomizationRequest from "../models/CustomizationRequest.js";
import Restaurant from "../models/Restaurant.js";
import Notification from "../models/Notification.js";
import { successResponse, errorResponse } from "../utils/responseHandler.js";

export const createCustomizationRequest = async (req, res) => {
  try {
    const {
      restaurantId,
      dietaryPreferences,
      allergies,
      mealTimes,
      additionalRequirements,
      caloriePreference,
    } = req.body;

    // Validate restaurant exists
    const restaurant = await Restaurant.findById(restaurantId);
    if (!restaurant) {
      return errorResponse(res, "Restaurant not found", 404);
    }

    // Create customization request
    const customizationRequest = new CustomizationRequest({
      user: req.user._id,
      restaurant: restaurantId,
      dietaryPreferences,
      allergies: allergies || [],
      mealTimes,
      additionalRequirements,
      caloriePreference: caloriePreference || "none",
      status: "pending",
    });

    await customizationRequest.save();

    // Create notification for restaurant owner
    const notification = new Notification({
      recipient: restaurant.owner,
      type: "customization_request",
      title: "New Customization Request",
      message: `You have received a new meal plan customization request from ${req.user.name}`,
      relatedCustomizationRequest: customizationRequest._id,
    });

    await notification.save();

    successResponse(
      res,
      customizationRequest,
      "Customization request submitted successfully",
      201
    );
  } catch (error) {
    console.error("Error creating customization request:", error);
    errorResponse(res, error.message, 400);
  }
};

export const getUserCustomizationRequests = async (req, res) => {
  try {
    const customizationRequests = await CustomizationRequest.find({
      user: req.user._id,
    })
      .populate("restaurant", "name cuisine")
      .sort({ createdAt: -1 });

    successResponse(
      res,
      customizationRequests,
      "User customization requests retrieved successfully"
    );
  } catch (error) {
    errorResponse(res, error.message, 400);
  }
};

export const getRestaurantCustomizationRequests = async (req, res) => {
  try {
    const { restaurantId } = req.params;
    const { status } = req.query;

    // Check if vendor is authorized to view requests for this restaurant
    const restaurant = await Restaurant.findById(restaurantId);
    if (!restaurant) {
      return errorResponse(res, "Restaurant not found", 404);
    }

    if (restaurant.owner.toString() !== req.user._id.toString()) {
      return errorResponse(
        res,
        "Not authorized to view requests for this restaurant",
        403
      );
    }

    // Build query
    const query = { restaurant: restaurantId };
    if (
      status &&
      ["pending", "approved", "rejected", "completed"].includes(status)
    ) {
      query.status = status;
    }

    const customizationRequests = await CustomizationRequest.find(query)
      .populate("user", "name email")
      .sort({ createdAt: -1 });

    successResponse(
      res,
      customizationRequests,
      "Restaurant customization requests retrieved successfully"
    );
  } catch (error) {
    errorResponse(res, error.message, 400);
  }
};

export const getCustomizationRequestDetails = async (req, res) => {
  try {
    const { id } = req.params;
    const customizationRequest = await CustomizationRequest.findById(id)
      .populate("user", "name email")
      .populate("restaurant", "name cuisine")
      .populate("resultingMealPlan");

    if (!customizationRequest) {
      return errorResponse(res, "Customization request not found", 404);
    }

    // Check if user is authorized to view this request
    if (
      req.user.role === "user" &&
      customizationRequest.user._id.toString() !== req.user._id.toString()
    ) {
      return errorResponse(
        res,
        "Not authorized to view this customization request",
        403
      );
    }

    // If vendor, check if request is for their restaurant
    if (req.user.role === "vendor") {
      const restaurant = await Restaurant.findOne({ owner: req.user._id });
      if (
        !restaurant ||
        customizationRequest.restaurant._id.toString() !==
          restaurant._id.toString()
      ) {
        return errorResponse(
          res,
          "Not authorized to view this customization request",
          403
        );
      }
    }

    successResponse(
      res,
      customizationRequest,
      "Customization request details retrieved successfully"
    );
  } catch (error) {
    errorResponse(res, error.message, 400);
  }
};

export const updateCustomizationRequestStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, rejectionReason } = req.body;

    const customizationRequest = await CustomizationRequest.findById(
      id
    ).populate("user", "name email");

    if (!customizationRequest) {
      return errorResponse(res, "Customization request not found", 404);
    }

    // Check if vendor is authorized to update this request
    const restaurant = await Restaurant.findById(
      customizationRequest.restaurant
    );
    if (!restaurant) {
      return errorResponse(res, "Restaurant not found", 404);
    }

    if (restaurant.owner.toString() !== req.user._id.toString()) {
      return errorResponse(
        res,
        "Not authorized to update this customization request",
        403
      );
    }

    // Validate status
    if (!["approved", "rejected"].includes(status)) {
      return errorResponse(
        res,
        "Invalid status. Must be 'approved' or 'rejected'",
        400
      );
    }

    // If rejecting, require a reason
    if (status === "rejected" && !rejectionReason) {
      return errorResponse(res, "Rejection reason is required", 400);
    }

    // Update request
    customizationRequest.status = status;
    if (status === "rejected") {
      customizationRequest.rejectionReason = rejectionReason;
    }

    await customizationRequest.save();

    // Create notification for user
    const notification = new Notification({
      recipient: customizationRequest.user._id,
      type: "customization_update",
      title: `Customization Request ${
        status === "approved" ? "Approved" : "Rejected"
      }`,
      message:
        status === "approved"
          ? `Your customization request has been approved. The restaurant will create a custom meal plan for you.`
          : `Your customization request has been rejected. Reason: ${rejectionReason}`,
      relatedCustomizationRequest: customizationRequest._id,
    });

    await notification.save();

    successResponse(
      res,
      customizationRequest,
      `Customization request ${status} successfully`
    );
  } catch (error) {
    errorResponse(res, error.message, 400);
  }
};

export const createCustomMealPlan = async (req, res) => {
  try {
    const { customizationRequestId } = req.params;
    const mealPlanData = req.body;

    const customizationRequest = await CustomizationRequest.findById(
      customizationRequestId
    ).populate("user", "name email");

    if (!customizationRequest) {
      return errorResponse(res, "Customization request not found", 404);
    }

    // Check if vendor is authorized
    const restaurant = await Restaurant.findById(
      customizationRequest.restaurant
    );
    if (!restaurant) {
      return errorResponse(res, "Restaurant not found", 404);
    }

    if (restaurant.owner.toString() !== req.user._id.toString()) {
      return errorResponse(
        res,
        "Not authorized to create custom meal plan for this request",
        403
      );
    }

    // Check if request is approved
    if (customizationRequest.status !== "approved") {
      return errorResponse(
        res,
        "Cannot create meal plan for a request that is not approved",
        400
      );
    }

    // Check if meal plan already exists
    if (customizationRequest.resultingMealPlan) {
      return errorResponse(
        res,
        "A meal plan has already been created for this request",
        400
      );
    }

    // Create meal plan controller will handle the actual creation
    // This is just a placeholder for the route
    // The actual implementation will be in the meal plan controller

    successResponse(
      res,
      { message: "Route is ready for implementation" },
      "Custom meal plan creation endpoint ready"
    );
  } catch (error) {
    errorResponse(res, error.message, 400);
  }
};
