const rawOrigins = process.env.CORS_ORIGIN || "*";
const allowAll = rawOrigins === "*";
const allowedOrigins = rawOrigins
  .split(",")
  .map((o) => o.trim())
  .filter(Boolean);

export const corsOptions = {
  origin(origin, callback) {
    if (allowAll || !origin) return callback(null, true);
    const ok = allowedOrigins.includes(origin);
    return callback(ok ? null : new Error("CORS blocked"), ok);
  },
  methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
  credentials: false,
};
