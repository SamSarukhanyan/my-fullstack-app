import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import helmet from "helmet";
import rateLimit from "express-rate-limit";
import pinoHttp from "pino-http";

import db from "#db/index.js";
import loadRoutes from "#config/routes.js";
import { errorMiddleware } from "#middlewares/error.middleware.js";
import { multerErrorHandler } from "#modules/post/middlewares/multerError.middleware.js";
import { corsOptions } from "#utils/corsOptions.js";
import { logger } from "#utils/logger.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const envPath =
  process.env.ENV_PATH ||
  (process.env.NODE_ENV === "test"
    ? path.join(__dirname, "../.env.test")
    : path.join(__dirname, "../.env"));
dotenv.config({ path: envPath });

const app = express();

app.set("trust proxy", 1);

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use(helmet());

app.use(
  pinoHttp({
    logger,
    genReqId: (req) => req.headers["x-request-id"],
  })
);

const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 500,
  standardHeaders: true,
  legacyHeaders: false,
});
app.use(generalLimiter);

app.use(cors(corsOptions));
app.use("/uploads", express.static(path.join(__dirname, "../uploads")));

const healthPayload = async () => {
  let dbOk = false;
  try {
    if (db?.sequelize) await db.sequelize.authenticate();
    dbOk = true;
  } catch {
    dbOk = false;
  }
  return { status: "OK", message: "Server is running", db: dbOk };
};

const sendHealth = async (req, res) => {
  try {
    const payload = await healthPayload();
    return res.status(200).json(payload);
  } catch (err) {
    return res.status(200).json({
      status: "OK",
      message: "Server is running",
      db: false,
      healthError: err?.message || "unknown",
    });
  }
};

// /api/health — когда Nginx передаёт путь как есть (proxy_pass без слэша в конце)
app.get("/api/health", sendHealth);

// /health — когда Nginx режет префикс /api (proxy_pass со слэшем: 4004/)
app.get("/health", sendHealth);

const apiRouter = express.Router();
loadRoutes(apiRouter);
app.use("/api", apiRouter);

app.use(multerErrorHandler);
app.use(errorMiddleware);

const uploadsDir = path.join(__dirname, "../uploads");
fs.mkdirSync(path.join(uploadsDir, "posts"), { recursive: true });
fs.mkdirSync(path.join(uploadsDir, "avatars"), { recursive: true });

const clientDistPath = path.resolve(__dirname, "../../client/dist");
if (fs.existsSync(clientDistPath)) {
  app.use(express.static(clientDistPath));
  app.get("*", (req, res) => {
    if (req.path.startsWith("/api")) {
      return res.status(404).send("API route not found");
    }
    res.sendFile(path.join(clientDistPath, "index.html"));
  });
}

export default app;
