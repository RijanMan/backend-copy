import Review from "../models/review.js";
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
    successResponse(res, 201, review);
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

    if (review.user.toString() !== req.user._id.toString()) {
      return errorResponse(res, "Not authorized to delete this review", 403);
    }

    await review.remove();
    successResponse(res, null, "Review deleted successfully");
  } catch (error) {
    errorResponse(res, error.message, 400);
  }
};
