import Restaurant from "../models/Restaurant.js";
import { successResponse, errorResponse } from "../utils/responseHandler.js";

export const createRestaurant = async (req, res) => {
  try {
    const restaurant = new Restaurant({
      ...req.body,
      owner: req.user._id,
    });
    await restaurant.save();
    successResponse(res, restaurant, "Restaurant created successfully", 201);
  } catch (error) {
    errorResponse(res, error.message, 400);
  }
};

export const getRestaurants = async (req, res) => {
  try {
    const page = Number.parseInt(req.query.page) || 1;
    const limit = Number.parseInt(req.query.limit) || 10;
    const startIndex = (page - 1) * limit;

    const total = await Restaurant.countDocuments();
    const restaurants = await Restaurant.find()
      .limit(limit)
      .skip(startIndex)
      .exec();

    successResponse(
      res,
      {
        restaurants,
        currentPage: page,
        totalPages: Math.ceil(total / limit),
        totalRestaurants: total,
      },
      "Restaurants retrieved successfully"
    );
  } catch (error) {
    errorResponse(res, error.message, 400);
  }
};

export const getRestaurant = async (req, res) => {
  try {
    const restaurant = await Restaurant.findById(req.params.id);
    if (!restaurant) {
      return errorResponse(res, "Restaurant not found", 404);
    }
    successResponse(res, restaurant, "Restaurant retrieved successfully");
  } catch (error) {
    errorResponse(res, error.message, 400);
  }
};

export const updateRestaurant = async (req, res) => {
  try {
    const restaurant = await Restaurant.findById(req.params.id);
    if (!restaurant) {
      return errorResponse(res, "Restaurant not found", 404);
    }

    if (restaurant.owner.toString() !== req.user._id.toString()) {
      return errorResponse(
        res,
        "Not authorized to update this restaurant",
        403
      );
    }

    const updatedRestaurant = await Restaurant.findByIdAndUpdate(
      req.params.id,
      req.body,
      {
        new: true,
        runValidators: true,
      }
    );
    successResponse(res, updatedRestaurant, "Restaurant updated successfully");
  } catch (error) {
    errorResponse(res, error.message, 400);
  }
};

export const deleteRestaurant = async (req, res) => {
  try {
    const restaurant = await Restaurant.findById(req.params.id);
    if (!restaurant) {
      return errorResponse(res, "Restaurant not found", 404);
    }

    if (restaurant.owner.toString() !== req.user._id.toString()) {
      return errorResponse(
        res,
        "Not authorized to delete this restaurant",
        403
      );
    }

    await Restaurant.findByIdAndDelete(req.params.id);
    successResponse(res, null, "Restaurant deleted successfully");
  } catch (error) {
    errorResponse(res, error.message, 400);
  }
};

export const searchRestaurants = async (req, res) => {
  try {
    const { query, cuisine } = req.query;
    const searchQuery = {};

    if (query) {
      searchQuery.$or = [
        { name: { $regex: query, $options: "i" } },
        { "address.city": { $regex: query, $options: "i" } },
      ];
    }

    if (cuisine) {
      searchQuery.cuisine = { $regex: cuisine, $options: "i" };
    }

    const restaurants = await Restaurant.find(searchQuery);
    successResponse(res, restaurants, "Restaurants search results");
  } catch (error) {
    errorResponse(res, error.message, 400);
  }
};
