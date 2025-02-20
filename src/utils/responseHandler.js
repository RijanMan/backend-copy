/**
 * Sends a success response.
 * @param {Object} res - Express response object.
 * @param {*} data - Data to be sent in the response.
 * @param {string} message - Success message.
 * @param {number} statusCode - HTTP status code.
 */
export const successResponse = (
  res,
  data,
  message = "Success",
  statusCode = 200
) => {
  return res.status(statusCode).json({
    success: true,
    message,
    data,
  });
};

/**
 * Sends an error response.
 * @param {Object} res - Express response object.
 * @param {string} message - Error message.
 * @param {number} statusCode - HTTP status code.
 * @param {Object} errors - Additional error details.
 */
export const errorResponse = (
  res,
  message = "Error",
  statusCode = 500,
  errors = null
) => {
  const response = {
    success: false,
    message,
  };

  if (errors) {
    response.errors = errors;
  }

  return res.status(statusCode).json(response);
};
