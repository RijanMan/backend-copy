import multer from "multer";
import path from "path";
import { fileURLToPath } from "url";
import fs from "fs";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const baseUploadDir = path.join(__dirname, "../../uploads");

const createUploadDirs = () => {
  const directories = [
    baseUploadDir,
    path.join(baseUploadDir, "profiles"),
    path.join(baseUploadDir, "restaurants"),
    path.join(baseUploadDir, "menu-items"),
    path.join(baseUploadDir, "documents"),
  ];

  directories.forEach((dir) => {
    if (!fs.existsSync(dir)) {
      try {
        fs.mkdirSync(dir, { recursive: true });
        console.log(`Directory created: ${dir}`);
      } catch (error) {
        console.error(`Error creating directory ${dir}:`, error);
      }
    }
  });
};

createUploadDirs();

const ALLOWED_IMAGE_TYPES = [
  "image/jpeg",
  "image/png",
  "image/gif",
  "image/webp",
];
const ALLOWED_DOCUMENT_TYPES = [
  "application/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
];

const MAX_IMAGE_SIZE = 5 * 1024 * 1024; // 5MB
const MAX_DOCUMENT_SIZE = 10 * 1024 * 1024; // 10MB

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    let uploadPath = baseUploadDir;

    if (file.fieldname === "profilePicture") {
      uploadPath = path.join(baseUploadDir, "profiles");
    } else if (file.fieldname === "restaurantImages") {
      uploadPath = path.join(baseUploadDir, "restaurants");
    } else if (file.fieldname === "menuImage") {
      uploadPath = path.join(baseUploadDir, "menu-items");
    } else if (file.fieldname === "document") {
      uploadPath = path.join(baseUploadDir, "documents");
    }

    cb(null, uploadPath);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    const fileExtension = path.extname(file.originalname);
    const sanitizedFilename =
      file.fieldname + "-" + uniqueSuffix + fileExtension;

    if (!req.uploadedFiles) {
      req.uploadedFiles = [];
    }

    const destinationPath = path.join(
      file.fieldname === "profilePicture"
        ? path.join(baseUploadDir, "profiles")
        : file.fieldname === "restaurantImages"
        ? path.join(baseUploadDir, "restaurants")
        : file.fieldname === "menuImage"
        ? path.join(baseUploadDir, "menu-items")
        : file.fieldname === "document"
        ? path.join(baseUploadDir, "documents")
        : baseUploadDir,
      sanitizedFilename
    );

    req.uploadedFiles.push(destinationPath);

    cb(null, sanitizedFilename);
  },
});

const fileFilter = (req, file, cb) => {
  if (!validateFileType(file)) {
    const errorMessage =
      file.fieldname === "document"
        ? "Invalid document type. Allowed types: PDF, DOC, DOCX"
        : "Invalid image type. Allowed types: JPEG, PNG, GIF, WEBP";
    return cb(new Error(errorMessage), false);
  }

  const maxSize =
    file.fieldname === "document" ? MAX_DOCUMENT_SIZE : MAX_IMAGE_SIZE;
  if (file.size > maxSize) {
    const errorMessage =
      file.fieldname === "document"
        ? `Document size exceeds the limit of ${maxSize / (1024 * 1024)}MB`
        : `Image size exceeds the limit of ${maxSize / (1024 * 1024)}MB`;
    return cb(new Error(errorMessage), false);
  }

  cb(null, true);
};

const validateFileType = (file) => {
  if (file.fieldname === "document") {
    return ALLOWED_DOCUMENT_TYPES.includes(file.mimetype);
  } else {
    return ALLOWED_IMAGE_TYPES.includes(file.mimetype);
  }
};

export const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: MAX_IMAGE_SIZE,
  },
});

export const removeFile = (filePath) => {
  if (fs.existsSync(filePath)) {
    fs.unlinkSync(filePath);
    console.log(`File removed: ${filePath}`);
    return true;
  }
  return false;
};

export const handleUploadError = (err, req, res, next) => {
  if (err instanceof multer.MulterError || err.message.includes("Invalid")) {
    // Clean up any uploaded files
    if (req.uploadedFiles && req.uploadedFiles.length > 0) {
      req.uploadedFiles.forEach((filePath) => {
        removeFile(filePath);
      });
    }

    return res.status(400).json({
      success: false,
      message: err.message || "File upload error",
      error: err.code || "UPLOAD_ERROR",
    });
  }

  next(err);
};

export const uploadProfileImage = (req, res, next) => {
  upload.single("profilePicture")(req, res, (err) => {
    if (err) {
      return handleUploadError(err, req, res, next);
    }
    next();
  });
};

export const uploadRestaurantImages = (req, res, next) => {
  upload.array("restaurantImages", 5)(req, res, (err) => {
    if (err) {
      return handleUploadError(err, req, res, next);
    }
    next();
  });
};

export const uploadMenuImage = (req, res, next) => {
  upload.single("menuImage")(req, res, (err) => {
    if (err) {
      return handleUploadError(err, req, res, next);
    }
    next();
  });
};

export const uploadDocument = (req, res, next) => {
  // Override the file size limit for documents
  const documentUpload = multer({
    storage: storage,
    fileFilter: fileFilter,
    limits: {
      fileSize: MAX_DOCUMENT_SIZE,
    },
  }).single("document");

  documentUpload(req, res, (err) => {
    if (err) {
      return handleUploadError(err, req, res, next);
    }
    next();
  });
};

export const filePathToUrl = (filePath) => {
  if (!filePath) return "";

  const normalizedPath = filePath.replace(/\\/g, "/");

  if (normalizedPath.includes(baseUploadDir.replace(/\\/g, "/"))) {
    return (
      "/uploads" +
      normalizedPath.substring(baseUploadDir.replace(/\\/g, "/").length)
    );
  }
  return normalizedPath;
};
