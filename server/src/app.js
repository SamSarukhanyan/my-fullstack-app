import express from "express";

import { loadAppEnv, paths, ensureUploadsDirs } from "#config/app.config.js";
import loadRoutes from "#config/routes.js";
import db from "#db/index.js";
import { errorMiddleware } from "#middlewares/error.middleware.js";
import { applyGlobalMiddlewares } from "#middlewares/global.middlewares.js";
import { multerErrorHandler } from "#modules/post/middlewares/multerError.middleware.js";
import { registerHealth } from "./routes/health.routes.js";
import { registerStaticAndSpa } from "./static.routes.js";

loadAppEnv();

const app = express();
app.set("trust proxy", 1);

applyGlobalMiddlewares(app);
app.use("/uploads", express.static(paths.uploadsDir));

registerHealth(app, db);

const apiRouter = express.Router();
loadRoutes(apiRouter);
app.use("/api", apiRouter);

app.use(multerErrorHandler);
app.use(errorMiddleware);

ensureUploadsDirs();
registerStaticAndSpa(app, paths);

export default app;
