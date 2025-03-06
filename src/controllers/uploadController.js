import { successResponse, errorResponse } from "../utils/responseHandler.js";
import { removeFile, filePathToUrl } from "../middlewares/uploadMiddleware.js";

/**
 * Generic file upload handler
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
export const uploadImage = async (req, res) => {
  try {
    if (!req.file) {
      return errorResponse(res, "Please upload a file", 400);
    }

    // Process the uploaded file
    const fileUrl = filePathToUrl(req.file.path);

    successResponse(
      res,
      {
        fileName: req.file.filename,
        filePath: req.file.path,
        fileUrl: fileUrl,
        fileType: req.file.mimetype,
        fileSize: req.file.size,
      },
      "File uploaded successfully"
    );
  } catch (error) {
    // Clean up the file if an error occurs after upload
    if (req.file) {
      removeFile(req.file.path);
    }
    errorResponse(res, error.message, 500);
  }
};

/**
 * Handler for profile image uploads
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
export const uploadProfileImage = async (req, res) => {
  try {
    if (!req.file) {
      return errorResponse(res, "Please upload a profile image", 400);
    }

    // Process the uploaded profile image
    const fileUrl = filePathToUrl(req.file.path);

    successResponse(
      res,
      {
        fileName: req.file.filename,
        filePath: req.file.path,
        fileUrl: fileUrl,
        fileType: req.file.mimetype,
        fileSize: req.file.size,
      },
      "Profile image uploaded successfully"
    );
  } catch (error) {
    // Clean up the file if an error occurs after upload
    if (req.file) {
      removeFile(req.file.path);
    }
    errorResponse(res, error.message, 500);
  }
};

/**
 * Handler for restaurant images uploads
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
export const uploadRestaurantImages = async (req, res) => {
  try {
    if (!req.files || req.files.length === 0) {
      return errorResponse(
        res,
        "Please upload at least one restaurant image",
        400
      );
    }

    // Process the uploaded restaurant images
    const fileDetails = req.files.map((file) => {
      const fileUrl = filePathToUrl(file.path);
      return {
        fileName: file.filename,
        filePath: file.path,
        fileUrl: fileUrl,
        fileType: file.mimetype,
        fileSize: file.size,
      };
    });

    successResponse(
      res,
      {
        count: req.files.length,
        files: fileDetails,
      },
      "Restaurant images uploaded successfully"
    );
  } catch (error) {
    // Clean up the files if an error occurs after upload
    if (req.files && req.files.length > 0) {
      req.files.forEach((file) => removeFile(file.path));
    }
    errorResponse(res, error.message, 500);
  }
};

/**
 * Handler for menu image uploads
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
export const uploadMenuImage = async (req, res) => {
  try {
    if (!req.file) {
      return errorResponse(res, "Please upload a menu image", 400);
    }

    // Process the uploaded menu image
    const fileUrl = filePathToUrl(req.file.path);

    successResponse(
      res,
      {
        fileName: req.file.filename,
        filePath: req.file.path,
        fileUrl: fileUrl,
        fileType: req.file.mimetype,
        fileSize: req.file.size,
      },
      "Menu image uploaded successfully"
    );
  } catch (error) {
    // Clean up the file if an error occurs after upload
    if (req.file) {
      removeFile(req.file.path);
    }
    errorResponse(res, error.message, 500);
  }
};

/**
 * Handler for document uploads
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
export const uploadDocument = async (req, res) => {
  try {
    if (!req.file) {
      return errorResponse(res, "Please upload a document", 400);
    }

    // Process the uploaded document
    const fileUrl = filePathToUrl(req.file.path);

    successResponse(
      res,
      {
        fileName: req.file.filename,
        filePath: req.file.path,
        fileUrl: fileUrl,
        fileType: req.file.mimetype,
        fileSize: req.file.size,
      },
      "Document uploaded successfully"
    );
  } catch (error) {
    // Clean up the file if an error occurs after upload
    if (req.file) {
      removeFile(req.file.path);
    }
    errorResponse(res, error.message, 500);
  }
};
