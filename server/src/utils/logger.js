import pino from "pino";

const level = process.env.LOG_LEVEL || "info";
const logPath = process.env.LOG_PATH || "";
const pretty = process.env.LOG_PRETTY === "true";

const transport = pretty
  ? {
      target: "pino-pretty",
      options: {
        colorize: true,
        translateTime: "SYS:standard",
        ignore: "pid,hostname",
      },
    }
  : undefined;

const destination = logPath ? pino.destination(logPath) : undefined;

export const logger = pino(
  {
    level,
    transport,
  },
  destination
);
