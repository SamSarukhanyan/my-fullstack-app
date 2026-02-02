// avatarMulter.js
import multer from "multer";
import path from "path";
import crypto from "crypto";
import { AppError } from "#utils/appError.js";

/**
 * Multer Configuration for Avatar (Profile Picture) Uploads
 * 
 * Field name: "avatar" (must match frontend FormData)
 * Max files: 1 (single file)
 * Max file size: 5MB
 * Allowed types: jpeg, jpg, png, gif
 */

/**
 * Disk storage configuration
 * Files are saved to "uploads/avatars" directory
 */
const storage = multer.diskStorage({
  destination(req, file, cb) {
    cb(null, "uploads/avatars");
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
 * Multer upload middleware for single avatar file
 * 
 * Configuration:
 * - Field name: "avatar" (CRITICAL: must match frontend FormData field name)
 * - Max files: 1
 * - Max file size: 5MB
 * - Storage: disk storage in "uploads/avatars" directory
 * 
 * Usage:
 * - router.post("/avatar", uploadAvatar, controller.uploadAvatar)
 * - File available in req.file (single file object, not array!)
 */
export const uploadAvatar = multer({
  storage,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB
  },
  fileFilter,
}).single("avatar"); // Field name "avatar", single file
