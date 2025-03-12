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

    if (menuItemData.ingredients) {
      if (typeof menuItemData.ingredients === "string") {
        menuItemData.ingredients = menuItemData.ingredients
          .split(",")
          .map((item) => item.trim());
      } 
    }

    // Handle allergens as array or string
    if (menuItemData.allergens) {
      if (typeof menuItemData.allergens === "string") {
        menuItemData.allergens = menuItemData.allergens
          .split(",")
          .map((item) => item.trim());
      }
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

    if (menuItemData.preparationTime) {
      menuItemData.preparationTime = Number.parseInt(
        menuItemData.preparationTime,
        10
      );
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

    // Check if the item already exists in the menu based on a unique property like name
    const existingMenuItem = menu.items.find(
      (item) => item.name.toLowerCase() === menuItemData.name.toLowerCase()
    );

    if (existingMenuItem) {
      // If the menu item exists, update it
      existingMenuItem.description =
        menuItemData.description || existingMenuItem.description;
      existingMenuItem.price = menuItemData.price || existingMenuItem.price;
      existingMenuItem.dietType =
        menuItemData.dietType || existingMenuItem.dietType;
      existingMenuItem.mealType =
        menuItemData.mealType || existingMenuItem.mealType;
      existingMenuItem.spicyLevel =
        menuItemData.spicyLevel || existingMenuItem.spicyLevel;
      existingMenuItem.isAvailable =
        menuItemData.isAvailable || existingMenuItem.isAvailable;
      existingMenuItem.allergens =
        menuItemData.allergens || existingMenuItem.allergens;

      if (req.file) {
        existingMenuItem.image = filePathToUrl(req.file.path);
      }

      await menu.save();
      return successResponse(
        res,
        existingMenuItem,
        "Menu item updated successfully",
        200
      );
    } else {
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
    }
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

    if (updateData.ingredients) {
      if (typeof updateData.ingredients === "string") {
        updateData.ingredients = updateData.ingredients
          .split(",")
          .map((item) => item.trim());
      } 
    }

    // Handle allergens if provided
    if (updateData.allergens) {
      if (typeof updateData.allergens === "string") {
        updateData.allergens = updateData.allergens
          .split(",")
          .map((item) => item.trim());
      }
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