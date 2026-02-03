//congif>routes.js

import { accountRouter } from "#modules/account/account.router.js";
import { authRouter } from "#modules/auth/auth.router.js";
import { postRouter } from "#modules/post/post.router.js";
import rateLimit from "express-rate-limit";

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
});

export default function (app) {
  app.use("/auth", authLimiter, authRouter);
  app.use("/account", accountRouter);
  app.use("/posts", postRouter);
}
