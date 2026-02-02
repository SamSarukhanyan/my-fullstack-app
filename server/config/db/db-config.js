// config/db/db-config.js
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";
import { Sequelize } from "sequelize";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
// Всегда грузим .env из корня server/, независимо от cwd
dotenv.config({ path: path.resolve(__dirname, "../../.env") });

const dbName = process.env.DB_NAME;
const dbUser = process.env.DB_USER;
// Поддерживаем DB_PASS и DB_PASSWORD. Если пароль содержит #, в .env укажите в кавычках: DB_PASSWORD="my#pass"
const dbPass = process.env.DB_PASS || process.env.DB_PASSWORD;
const dbHost = process.env.DB_HOST || "localhost";

if (!dbName || !dbUser) {
  throw new Error("В server/.env должны быть заданы DB_NAME и DB_USER");
}
if (!dbPass) {
  throw new Error("В server/.env задайте пароль MySQL: DB_PASS=... или DB_PASSWORD=...");
}

export const sequelize = new Sequelize(dbName, dbUser, dbPass, {
  host: dbHost,
  dialect: "mysql",
  logging: false,
});
