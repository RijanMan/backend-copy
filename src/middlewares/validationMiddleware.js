import { validationResult } from "express-validator";
import { errorResponse } from "../utils/responseHandler.js";

export const validate = (validations) => {
  return async (req, res, next) => {
    try {
      await Promise.all(validations.map((validation) => validation.run(req)));

      const errors = validationResult(req);
      if (errors.isEmpty()) {
        return next();
      }

      const extractedErrors = errors
        .array()
        .map((err) => ({ [err.param]: err.msg }));
      return errorResponse(res, "Validation error", 422, extractedErrors);
    } catch (err) {
      return errorResponse(res, "Server error", 500, [{ error: err.message }]);
    }
  };
};
