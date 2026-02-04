async function healthPayload(db) {
  let dbOk = false;
  try {
    if (db?.sequelize) await db.sequelize.authenticate();
    dbOk = true;
  } catch {
    dbOk = false;
  }
  return { status: "OK", message: "Server is running", db: dbOk };
}

async function sendHealth(req, res, db) {
  try {
    const payload = await healthPayload(db);
    return res.status(200).json(payload);
  } catch (err) {
    return res.status(200).json({
      status: "OK",
      message: "Server is running",
      db: false,
      healthError: err?.message || "unknown",
    });
  }
}

/** Register /api/health and /health (for Nginx with or without /api prefix). */
export function registerHealth(app, db) {
  const handler = (req, res) => sendHealth(req, res, db);
  app.get("/api/health", handler);
  app.get("/health", handler);
}
