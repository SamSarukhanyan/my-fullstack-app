//post.router.js
import express from "express";
import db from "#db/index.js";
import { PostService } from "./post.service.js";
import { PostController } from "./post.controller.js";
import { upload } from "./middlewares/multer.js";
import { asyncHandler } from "#middlewares/async.Handler.js";
import { commentRouter } from "#modules/comment/comment.router.js";
import { isAuthenticated } from "#middlewares/isAuthenticate.js";

const postService = new PostService(
  db.sequelize,
  db.Post,
  db.User,
  db.PostImage,
  db.Like,
  db.Comment,
  db.Follow
);
const postController = new PostController(postService);

export const postRouter = express.Router();

postRouter.use(isAuthenticated(db.User));

postRouter.get("/", asyncHandler(postController.getPosts.bind(postController)));
postRouter.post(
  "/",
  upload,
  asyncHandler(postController.createPost.bind(postController))
);
postRouter.post(
  "/:id/like",
  asyncHandler(postController.likePost.bind(postController))
);
postRouter.use("/:id/comments", commentRouter);
postRouter.get(
  "/:id",
  asyncHandler(postController.getPostById.bind(postController))
);
