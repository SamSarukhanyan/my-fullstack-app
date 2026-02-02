import multer from "multer";
import { AppError } from "#utils/appError.js";

export const multerErrorHandler = (err, req, res, next) => {
  if (!err) return next();
  
  // Multer errors
  if (err instanceof multer.MulterError) {
    // Log for debugging / monitoring
    console.error("Multer error:", {
      code: err.code,
      field: err.field,
      message: err.message,
    });

    // Customize message for client based on error code
    let message = err.message;
    
    switch (err.code) {
      case "LIMIT_FILE_SIZE":
        message = "File too large. Maximum size is 5MB per file.";
        break;
      case "LIMIT_FILE_COUNT":
        message = "Too many files. Maximum is 10 files per post.";
        break;
      case "LIMIT_UNEXPECTED_FILE":
        message = `Unexpected field "${err.field}". Expected field name: "photos".`;
        break;
      case "LIMIT_PART_COUNT":
        message = "Too many parts in the request.";
        break;
      case "LIMIT_FIELD_KEY":
        message = "Field name too long.";
        break;
      case "LIMIT_FIELD_VALUE":
        message = "Field value too long.";
        break;
      case "LIMIT_FIELD_COUNT":
        message = "Too many fields.";
        break;
      default:
        message = `Upload error: ${err.message}`;
    }

    return next(new AppError(message, 400));
  }

  // Already our AppError
  if (err instanceof AppError) {
    return next(err);
  }

  // Any other unknown error → forward to global error handler
  next(err);
};
