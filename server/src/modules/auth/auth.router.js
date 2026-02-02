//auth.router.js
import express from "express";
import { AuthController } from "#modules/auth/auth.controller.js";
import { AuthService } from "#modules/auth/auth.service.js";
import { signupValidator } from "#modules/auth/validators/signup.validator.js";
import db from "#db/index.js";
import { passwordHash } from "#middlewares/passwordPipe.js";
import { loginValidator } from "#modules/auth/validators/login.validator.js";
import { changeUsernameValidator } from "#modules/auth/validators/changeUsername.validator.js";
import { asyncHandler } from "#middlewares/async.Handler.js";
import { isAuthenticated } from "#middlewares/isAuthenticate.js";

export const authRouter = express.Router();

const authService = new AuthService(db.User, db.Post, db.sequelize);
const authController = new AuthController(authService);

authRouter.post(
  "/signup",
  asyncHandler(signupValidator.bind(null, authService)),
  asyncHandler(passwordHash),
  asyncHandler(authController.signup.bind(authController))
);
authRouter.post(
  "/login",
  asyncHandler(loginValidator.bind(null, authService)),
  asyncHandler(authController.login.bind(authController))
);
authRouter.use(isAuthenticated(db.User));
authRouter.get(
  "/user",
  asyncHandler(authController.getAuthUser.bind(authController))
);
authRouter.patch(
  "/user/username",
  asyncHandler(changeUsernameValidator),
  asyncHandler(authController.changeUsername.bind(authController))
);
authRouter.patch(
  "/user/privacy",
  asyncHandler(authController.changePrivacy.bind(authController))
);
