import jwt from "jsonwebtoken";

// Verify JWT token
export const verifyToken = (req, res, next) => {
  const token = req.header("Authorization")?.split(" ")[1];
  if (!token) return res.status(401).json({ message: "Access denied" });

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    next();
  } catch (err) {
    res.status(400).json({ message: "Invalid token" });
  }
};

// // Check if user is an admin
// export const isAdmin = (req, res, next) => {
//   if (req.user.role !== "admin") {
//     return res.status(403).json({ message: "Access denied" });
//   }
//   next();
// };

// // Check if user is a restaurant
// export const isRestaurant = (req, res, next) => {
//   if (req.user.role !== "restaurant") {
//     return res.status(403).json({ message: "Access denied" });
//   }
//   next();
// };
