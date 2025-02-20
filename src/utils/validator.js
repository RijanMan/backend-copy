import validator from "validator";

/**
 * Validates user registration data.
 * @param {Object} data - The registration data to validate.
 * @returns {Object} - An object containing validation results.
 */
export const validateRegistration = (data) => {
  const errors = {};

  // Name validation
  if (!data.name || !validator.isLength(data.name, { min: 2, max: 50 })) {
    errors.name = "Name must be between 2 and 50 characters";
  }

  // Email validation
  if (!data.email || !validator.isEmail(data.email)) {
    errors.email = "Please provide a valid email address";
  }

  // Password validation
  if (!data.password) {
    errors.password = "Password is required";
  } else {
    if (!validator.isLength(data.password, { min: 8 })) {
      errors.password = "Password must be at least 8 characters long";
    }
    if (!/\d/.test(data.password)) {
      errors.password = "Password must contain at least one number";
    }
    if (!/[a-z]/.test(data.password)) {
      errors.password = "Password must contain at least one lowercase letter";
    }
    if (!/[A-Z]/.test(data.password)) {
      errors.password = "Password must contain at least one uppercase letter";
    }
    if (!/[!@#$%^&*]/.test(data.password)) {
      errors.password = "Password must contain at least one special character";
    }
  }

  // Role validation
  const validRoles = ["user", "vendor", "rider", "admin"];
  if (data.role && !validRoles.includes(data.role)) {
    errors.role = "Invalid role specified";
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors,
  };
};
