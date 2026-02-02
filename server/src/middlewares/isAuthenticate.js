import jwt from "jsonwebtoken";
import { AppError } from "#utils/appError.js";

export function isAuthenticated(userModel) {
  return async (req, res, next) => {
    try {
      const authHeader = req.headers.authorization;
      if (!authHeader) {
        throw new AppError("No token provided", 401);
      }

      const token = authHeader.split(" ")[1];
      if (!token) {
        throw new AppError("Malformed authorization header", 401);
      }

      const decoded = jwt.verify(token, process.env.JWT_SECRET);

      const user = await userModel.findByPk(decoded.id);
      if (!user) {
        throw new AppError("User no longer exists", 401);
      }

      req.user = { id: user.id };
      next();
    } catch (err) {
      if (err.name === "JsonWebTokenError") {
        return next(new AppError("Invalid token", 401));
      }

      if (err.name === "TokenExpiredError") {
        return next(new AppError("Token expired", 401));
      }

      next(err);
    }
  };
}
