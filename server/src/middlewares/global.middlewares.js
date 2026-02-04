import cors from "cors";
import express from "express";
import helmet from "helmet";
import pinoHttp from "pino-http";

import { generalLimiter } from "#config/rateLimit.config.js";
import { corsOptions } from "#utils/corsOptions.js";
import { logger } from "#utils/logger.js";

/** Apply global middlewares: body parsers, security, logging, rate limit, CORS. */
export function applyGlobalMiddlewares(app) {
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));
  app.use(helmet());
  app.use(
    pinoHttp({
      logger,
      genReqId: (req) => req.headers["x-request-id"],
    })
  );
  app.use(generalLimiter);
  app.use(cors(corsOptions));
}
