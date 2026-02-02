//congif>routes.js

import { accountRouter } from "#modules/account/account.router.js";
import { authRouter } from "#modules/auth/auth.router.js";
import { postRouter } from "#modules/post/post.router.js";

export default function (app) {
  app.use("/auth", authRouter);
  app.use("/account", accountRouter);
  app.use("/posts", postRouter);
}
