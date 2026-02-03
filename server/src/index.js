import app from "./app.js";
import db from "#db/index.js";
import { logger } from "#utils/logger.js";

const PORT = process.env.PORT || 4004;

app.listen(PORT, () => {
  logger.info({ port: PORT }, "Server started");
});

(async () => {
  try {
    await db.sequelize.authenticate();
    logger.info("DB connected");
  } catch (err) {
    logger.error({ err }, "DB connection failed (API still up)");
  }
})();
