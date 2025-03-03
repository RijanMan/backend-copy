import Menu from "../models/Menu.js";
import Restaurant from "../models/Restaurant.js";
import { successResponse, errorResponse } from "../utils/responseHandler.js";

export const createMenuItem = async (req, res) => {
  try {
    const { restaurantId } = req.params;
    const menuItemData = req.body;

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
      menuItemData.image = `/uploads/menu-items/${req.file.filename}`;
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
    const menu = await Menu.findOne({ restaurant: restaurantId });
    if (!menu) {
      return errorResponse(res, "Menu not found for this restaurant", 404);
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
      menuItem.image = `/uploads/menu-items/${req.file.filename}`;
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
