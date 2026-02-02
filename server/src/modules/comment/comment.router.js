import express from "express";
import { CommentController } from "./comment.controller.js";
import { CommentService } from "./comment.service.js";
import { asyncHandler } from "#middlewares/async.Handler.js";
import db from "#db/index.js";
import { isAuthenticated } from "#middlewares/isAuthenticate.js";

const commentService = new CommentService(db.Comment, db.Post, db.sequelize);
const commentController = new CommentController(commentService);

export const commentRouter = express.Router({ mergeParams: true });

commentRouter.use(isAuthenticated(db.User));
commentRouter.post(
  "/",
  asyncHandler(commentController.addComment.bind(commentController))
);
