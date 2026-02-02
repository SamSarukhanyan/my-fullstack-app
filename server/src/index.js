import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import db from "#db/index.js";
import loadRoutes from "#config/routes.js";

import { errorMiddleware } from "#middlewares/error.middleware.js";
import { multerErrorHandler } from "#modules/post/middlewares/multerError.middleware.js";
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { corsOptions } from "./utils/corsOptions.js";

dotenv.config({ path: path.join(path.dirname(fileURLToPath(import.meta.url)), '../.env') });

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use(cors(corsOptions));
app.use("/uploads", express.static(path.join(__dirname, "../uploads")));


app.get('/api/get', (req, res) => {
    res.status(200).json({ message: 'GET request successful' });
});
let dbConnected = false;
app.get('/api/health', (req, res) => {
    res.status(200).json({
        status: 'OK',
        message: 'Server is running',
        db: dbConnected,
    });
});


loadRoutes(app);
//Error middlewares

app.use(multerErrorHandler);
app.use(errorMiddleware);

const uploadsDir = path.join(__dirname, '../uploads');
fs.mkdirSync(path.join(uploadsDir, 'posts'), { recursive: true });
fs.mkdirSync(path.join(uploadsDir, 'avatars'), { recursive: true });
//await resetPosts(db.sequelize, db.Post, db.PostImage, db.Like);

// --- Serve static frontend after API ---
const clientDistPath = path.resolve(__dirname, '../../client/dist');
app.use(express.static(clientDistPath));

app.get('/{*path}', (req, res) => {
    if (req.path.startsWith('/api')) return res.status(404).send('API route not found');
    res.sendFile(path.join(clientDistPath, 'index.html'));
});

const PORT = process.env.PORT || 4004;
app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
});

(async () => {
  try {
    await db.sequelize.authenticate();
    await db.sequelize.sync();
    dbConnected = true;
    console.log("✅ DB connected & synced");
  } catch (err) {
    console.error("❌ DB connection failed (API still up):", err.message);
    // Server already listening; /api/health will return db: false
  }
})();