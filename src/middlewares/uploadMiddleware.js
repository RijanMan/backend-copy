import multer from "multer";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    let uploadPath = path.join(__dirname, "../../uploads/");

    if (file.fieldname === "restaurantImages") {
      uploadPath = path.join(uploadPath, "restaurants");
    } else if (file.fieldname === "menuImages") {
      uploadPath = path.join(uploadPath, "menu-items");
    } else if (file.fieldname === "profileImage") {
      uploadPath = path.join(uploadPath, "profiles");
    }

    cb(null, uploadPath);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(
      null,
      file.fieldname + "-" + uniqueSuffix + path.extname(file.originalname)
    );
  },
});

const fileFilter = (req, file, cb) => {
  if (file.mimetype.startsWith("image")) {
    cb(null, true);
  } else {
    cb(new Error("Not an image! Please upload an image."), false);
  }
};

export const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 1024 * 1024 * 5, // 5MB limit
  },
});

export const uploadRestaurantImages = upload.array("restaurantImages", 5);
export const uploadMenuImage = upload.array("menuImages", 5);
export const uploadProfileImage = upload.single("profileImage");
