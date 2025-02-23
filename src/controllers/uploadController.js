import { successResponse, errorResponse } from "../utils/responseHandler.js";

export const uploadImage = async (req, res) => {
  try {
    if (!req.file) {
      return errorResponse(res, "Please upload a file", 400);
    }

    successResponse(
      res,
      { imagePath: req.file.path },
      "File uploaded successfully"
    );
  } catch (error) {
    errorResponse(res, error.message, 500);
  }
};
