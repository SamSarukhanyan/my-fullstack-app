// multer.js
import multer from "multer";
import path from "path";
import crypto from "crypto";
import { AppError } from "#utils/appError.js";

/**
 * Multer Configuration for Post Image Uploads
 * 
 * Field name: "photos" (must match frontend FormData)
 * Max files: 10
 * Max file size: 5MB per file
 * Allowed types: jpeg, jpg, png, gif
 */

/**
 * Disk storage configuration
 * Files are saved to "uploads/posts" directory
 */
const uploadsDir = path.resolve(process.cwd(), "uploads/posts");

const storage = multer.diskStorage({
  destination(req, file, cb) {
    cb(null, uploadsDir);
  },

  /**
   * Generate unique filename to prevent conflicts
   * Format: {random-hex}-{sanitized-original-name}.{ext}
   */
  filename(req, file, cb) {
    const unique = crypto.randomBytes(6).toString("hex");
    const ext = path.extname(file.originalname).toLowerCase();
    const base = path.basename(file.originalname, ext).replace(/[^\w\-]/g, "_");

    cb(null, `${unique}-${base}${ext}`);
  },
});

/**
 * File filter - validates file type
 * Checks both extension and MIME type for security
 */
function fileFilter(req, file, cb) {
  const allowedExtensions = /\.(jpeg|jpg|png|gif)$/i;
  const allowedMimeTypes = /^image\/(jpeg|jpg|png|gif)$/i;
  
  const ext = allowedExtensions.test(path.extname(file.originalname));
  const mime = allowedMimeTypes.test(file.mimetype);

  if (!ext || !mime) {
    return cb(
      new AppError(
        "Invalid file type. Only JPEG, JPG, PNG, and GIF images are allowed.",
        400
      )
    );
  }

  cb(null, true);
}

/**
 * Multer upload middleware
 * 
 * Configuration:
 * - Field name: "photos" (CRITICAL: must match frontend FormData field name)
 * - Max files: 10
 * - Max file size: 5MB per file
 * - Storage: disk storage in "uploads/posts" directory
 * 
 * Usage:
 * - router.post("/", upload, controller.createPost)
 * - Files available in req.files (array)
 */
export const upload = multer({
  storage,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB per file
    files: 10, // Maximum 10 files
  },
  fileFilter,
}).array("photos", 10); // Field name "photos", max 10 files
