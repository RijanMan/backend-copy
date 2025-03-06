import Menu from "../models/Menu.js";
import Restaurant from "../models/Restaurant.js";
import { successResponse, errorResponse } from "../utils/responseHandler.js";
import { filePathToUrl } from "../middlewares/uploadMiddleware.js";

export const createMenuItem = async (req, res) => {
  try {
    const { restaurantId } = req.params;
    const menuItemData = req.body;

    // Validate diet type
    if (
      !menuItemData.dietType ||
      !["vegan", "vegetarian", "non-vegetarian"].includes(menuItemData.dietType)
    ) {
      return errorResponse(
        res,
        "Valid diet type (vegan, vegetarian, or non-vegetarian) is required",
        400
      );
    }

    // Validate meal type
    if (
      !menuItemData.mealType ||
      !["breakfast", "lunch", "dinner", "all-day"].includes(
        menuItemData.mealType
      )
    ) {
      return errorResponse(
        res,
        "Valid meal type (breakfast, lunch, dinner, or all-day) is required",
        400
      );
    }

    // Convert string values to appropriate types
    if (menuItemData.price) {
      menuItemData.price = Number.parseFloat(menuItemData.price);
    }

    if (menuItemData.spicyLevel) {
      menuItemData.spicyLevel = Number.parseInt(menuItemData.spicyLevel, 10);
    }

    if (menuItemData.isAvailable) {
      menuItemData.isAvailable = menuItemData.isAvailable === "true";
    }

    if (menuItemData.allergens && typeof menuItemData.allergens === "string") {
      menuItemData.allergens = menuItemData.allergens
        .split(",")
        .map((item) => item.trim());
    }

    const restaurant = await Restaurant.findById(restaurantId);
    if (!restaurant) {
      return errorResponse(res, "Restaurant not found", 404);
    }

    if (restaurant.owner.toString() !== req.user._id.toString()) {
      return errorResponse(
        res,
        "Not authorized to manage menu for this restaurant",
        403
      );
    }

    let menu = await Menu.findOne({ restaurant: restaurantId });

    if (!menu) {
      menu = new Menu({
        restaurant: restaurantId,
        items: [],
      });
    }
    // } else {
    //   menu.items.push(menuItemData);
    // }

    if (req.file) {
      menuItemData.image = filePathToUrl(req.file.path);
    }

    menu.items.push(menuItemData);
    await menu.save();
    successResponse(
      res,
      menu.items[menu.items.length - 1],
      "Menu item created successfully",
      201
    );
  } catch (error) {
    errorResponse(res, error.message, 400);
  }
};

export const getMenuItems = async (req, res) => {
  try {
    const { restaurantId } = req.params;
    const { dietType, mealType, category } = req.query;

    const menu = await Menu.findOne({ restaurant: restaurantId });
    if (!menu) {
      return errorResponse(res, "Menu not found for this restaurant", 404);
    }

    let items = menu.items;

    if (
      dietType &&
      ["vegan", "vegetarian", "non-vegetarian"].includes(dietType)
    ) {
      items = items.filter((item) => item.dietType === dietType);
    }

    if (
      mealType &&
      ["breakfast", "lunch", "dinner", "all-day"].includes(mealType)
    ) {
      items = items.filter((item) => item.mealType === mealType);
    }

    if (category) {
      items = items.filter((item) => item.category === category);
    }

    successResponse(res, menu.items, "Menu items retrieved successfully");
  } catch (error) {
    errorResponse(res, error.message, 400);
  }
};

export const getMenuItem = async (req, res) => {
  try {
    const { restaurantId, itemId } = req.params;
    const menu = await Menu.findOne({ restaurant: restaurantId });
    if (!menu) {
      return errorResponse(res, "Menu not found for this restaurant", 404);
    }
    const menuItem = menu.items.id(itemId);
    if (!menuItem) {
      return errorResponse(res, "Menu item not found", 404);
    }
    successResponse(res, menuItem, "Menu item retrieved successfully");
  } catch (error) {
    errorResponse(res, error.message, 400);
  }
};

export const updateMenuItem = async (req, res) => {
  try {
    const { restaurantId, itemId } = req.params;
    const updateData = req.body;

    // Validate diet type if provided
    if (
      updateData.dietType &&
      !["vegan", "vegetarian", "non-vegetarian"].includes(updateData.dietType)
    ) {
      return errorResponse(
        res,
        "Valid diet type (vegan, vegetarian, or non-vegetarian) is required",
        400
      );
    }

    // Validate meal type if provided
    if (
      updateData.mealType &&
      !["breakfast", "lunch", "dinner", "all-day"].includes(updateData.mealType)
    ) {
      return errorResponse(
        res,
        "Valid meal type (breakfast, lunch, dinner, or all-day) is required",
        400
      );
    }

    // Convert string values to appropriate types
    if (updateData.price) {
      updateData.price = Number.parseFloat(updateData.price);
    }

    if (updateData.spicyLevel) {
      updateData.spicyLevel = Number.parseInt(updateData.spicyLevel, 10);
    }

    if (updateData.isAvailable !== undefined) {
      updateData.isAvailable = updateData.isAvailable === "true";
    }

    if (updateData.allergens && typeof updateData.allergens === "string") {
      updateData.allergens = updateData.allergens
        .split(",")
        .map((item) => item.trim());
    }

    const menu = await Menu.findOne({ restaurant: restaurantId });
    if (!menu) {
      return errorResponse(res, "Menu not found for this restaurant", 404);
    }

    const restaurant = await Restaurant.findById(restaurantId);
    if (restaurant.owner.toString() !== req.user._id.toString()) {
      return errorResponse(
        res,
        "Not authorized to update items in this menu",
        403
      );
    }

    const menuItem = menu.items.id(itemId);
    if (!menuItem) {
      return errorResponse(res, "Menu item not found", 404);
    }

    Object.assign(menuItem, updateData);

    if (req.file) {
      menuItem.image = filePathToUrl(req.file.path);
    }

    await menu.save();
    successResponse(res, menuItem, "Menu item updated successfully");
  } catch (error) {
    errorResponse(res, error.message, 400);
  }
};

export const deleteMenuItem = async (req, res) => {
  try {
    const { restaurantId, itemId } = req.params;

    const menu = await Menu.findOne({ restaurant: restaurantId });
    if (!menu) {
      return errorResponse(res, "Menu not found for this restaurant", 404);
    }

    const restaurant = await Restaurant.findById(restaurantId);
    if (restaurant.owner.toString() !== req.user._id.toString()) {
      return errorResponse(
        res,
        "Not authorized to delete items from this menu",
        403
      );
    }

    menu.items = menu.items.filter((item) => item._id.toString() !== itemId);
    await menu.save();

    successResponse(res, null, "Menu item deleted successfully");
  } catch (error) {
    errorResponse(res, error.message, 400);
  }
};

export const getMenuItemsByDietType = async (req, res) => {
  try {
    const { restaurantId, dietType } = req.params;

    if (!["vegan", "vegetarian", "non-vegetarian"].includes(dietType)) {
      return errorResponse(
        res,
        "Invalid diet type. Must be vegan, vegetarian, or non-vegetarian",
        400
      );
    }

    const menu = await Menu.findOne({ restaurant: restaurantId });
    if (!menu) {
      return errorResponse(res, "Menu not found for this restaurant", 404);
    }

    const filteredItems = menu.items.filter(
      (item) => item.dietType === dietType
    );

    successResponse(
      res,
      filteredItems,
      `${dietType} menu items retrieved successfully`
    );
  } catch (error) {
    errorResponse(res, error.message, 400);
  }
};

export const getMenuItemsByMealType = async (req, res) => {
  try {
    const { restaurantId, mealType } = req.params;

    if (!["breakfast", "lunch", "dinner", "all-day"].includes(mealType)) {
      return errorResponse(
        res,
        "Invalid meal type. Must be breakfast, lunch, dinner, or all-day",
        400
      );
    }

    const menu = await Menu.findOne({ restaurant: restaurantId });
    if (!menu) {
      return errorResponse(res, "Menu not found for this restaurant", 404);
    }

    const filteredItems = menu.items.filter(
      (item) => item.mealType === mealType
    );

    successResponse(
      res,
      filteredItems,
      `${mealType} menu items retrieved successfully`
    );
  } catch (error) {
    errorResponse(res, error.message, 400);
  }
};
