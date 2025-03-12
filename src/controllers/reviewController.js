import Review from "../models/Review.js";
import { successResponse, errorResponse } from "../utils/responseHandler.js";

export const createReview = async (req, res) => {
  try {
    const { rating, comment, reviewedItem, itemType } = req.body;

    const review = new Review({
      user: req.user._id,
      rating,
      comment,
      reviewedItem,
      itemType,
    });

    await review.save();
    successResponse(res, review, "Review created successfully", 201);
  } catch (error) {
    errorResponse(res, 500, error.message);
  }
};

export const getReviews = async (req, res) => {
  try {
    const { itemType, itemId } = req.params;
    const reviews = await Review.find({
      reviewedItem: itemId,
      itemType,
    }).populate("user", "name ");
    successResponse(res, reviews, "Reviews fetched successfully");
  } catch (error) {
    errorResponse(res, 500, error.message);
  }
};

export const updateReview = async (req, res) => {
  try {
    const { id } = req.params;
    const { rating, comment } = req.body;

    const review = await Review.findById(id);
    if (!review) {
      return errorResponse(res, "Review not found", 404);
    }

    if (review.user.toString() !== req.user._id.toString()) {
      return errorResponse(res, "Not authorized to update this review", 403);
    }

    review.rating = rating || review.rating;
    review.comment = comment || review.comment;
    await review.save();

    successResponse(res, review, "Review updated successfully");
  } catch (error) {
    errorResponse(res, error.message, 400);
  }
};

export const deleteReview = async (req, res) => {
  try {
    const { id } = req.params;

    const review = await Review.findById(id);
    if (!review) {
      return errorResponse(res, "Review not found", 404);
    }

    if (
      review.user.toString() !== req.user._id.toString() &&
      req.user.role !== "admin"
    ) {
      return errorResponse(res, "Not authorized to delete this review", 403);
    }

    await Review.findByIdAndDelete(id);
    successResponse(res, null, "Review deleted successfully");
  } catch (error) {
    errorResponse(res, error.message, 400);
  }
};

export const getUserReviews = async (req, res) => {
  try {
    const reviews = await Review.find({ user: req.user._id })
      .populate("reviewedItem", "name")
      .sort({ createdAt: -1 });

    successResponse(res, reviews, "User reviews retrieved successfully");
  } catch (error) {
    console.error("Error retrieving user reviews:", error);
    errorResponse(res, error.message, 400);
  }
};
