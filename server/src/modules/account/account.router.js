import express from "express";
import { AccountService } from "#modules/account/account.service.js";
import { RecommendedService } from "#modules/account/recommended.service.js";
import { RecommendedController } from "#modules/account/recommended.controller.js";
import db from "#db/index.js";
import { AccountController } from "#modules/account/account.controller.js";
import { asyncHandler } from "#middlewares/async.Handler.js";
import { isAuthenticated } from "#middlewares/isAuthenticate.js";
import { uploadAvatar } from "#modules/account/middlewares/avatarMulter.js";
import { multerErrorHandler } from "#modules/post/middlewares/multerError.middleware.js";

export const accountRouter = express.Router();

const accountService = new AccountService(
  db.User,
  db.Follow,
  db.Post,
  db.sequelize
);
const accountController = new AccountController(accountService);

// Recommended Users Service (isolated, does not affect existing logic)
const recommendedService = new RecommendedService(
  db.User,
  db.Follow,
  db.sequelize
);
const recommendedController = new RecommendedController(recommendedService);

accountRouter.use(isAuthenticated(db.User));

accountRouter.get(
  "/search/:text",
  asyncHandler(accountController.search.bind(accountController))
);

accountRouter.get(
  "/followers",
  asyncHandler(accountController.getFollowers.bind(accountController))
);
accountRouter.get(
  "/followers/:userId",
  asyncHandler(accountController.getFollowers.bind(accountController))
);
accountRouter.get(
  "/followings",
  asyncHandler(accountController.getFollowings.bind(accountController))
);
accountRouter.get(
  "/followings/:userId",
  asyncHandler(accountController.getFollowings.bind(accountController))
);
accountRouter.get(
  "/requests",
  asyncHandler(accountController.requests.bind(accountController))
);
accountRouter.patch(
  "/request/:id/accept",
  asyncHandler(accountController.acceptFollow.bind(accountController))
);
accountRouter.patch(
  "/request/:id/decline",
  asyncHandler(accountController.declineFollow.bind(accountController))
);
// Recommended Users endpoint (added before /:id to avoid route conflicts)
accountRouter.get(
  "/recommended",
  asyncHandler(recommendedController.getRecommended.bind(recommendedController))
);
accountRouter.post(
  "/:id/follow",
  asyncHandler(accountController.follow.bind(accountController))
);
accountRouter.get(
  "/:id",
  asyncHandler(accountController.getById.bind(accountController))
);

// Avatar routes (must be before /:id to avoid route conflicts)
accountRouter.post(
  "/avatar",
  uploadAvatar,
  multerErrorHandler,
  asyncHandler(accountController.uploadAvatar.bind(accountController))
);
accountRouter.delete(
  "/avatar",
  asyncHandler(accountController.deleteAvatar.bind(accountController))
);
