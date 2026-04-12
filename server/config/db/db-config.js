// config/db/db-config.js
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";
import { Sequelize } from "sequelize";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const envPath = process.env.ENV_PATH
  ? path.isAbsolute(process.env.ENV_PATH)
    ? process.env.ENV_PATH
    : path.resolve(process.cwd(), process.env.ENV_PATH)
  : path.resolve(__dirname, "../../.env");
// Load .env while respecting ENV_PATH (for example, .env.test)
dotenv.config({ path: envPath });

const isTest = process.env.NODE_ENV === "test";
const dbName = isTest ? process.env.DB_NAME_TEST : process.env.DB_NAME;
const dbUser = isTest ? process.env.DB_USER_TEST || process.env.DB_USER : process.env.DB_USER;
// Support both DB_PASS and DB_PASSWORD. If the password contains #, wrap it in quotes in .env: DB_PASSWORD="my#pass"
const dbPass = isTest
  ? process.env.DB_PASS_TEST || process.env.DB_PASSWORD_TEST || process.env.DB_PASS || process.env.DB_PASSWORD
  : process.env.DB_PASS || process.env.DB_PASSWORD;
const dbHost = isTest ? process.env.DB_HOST_TEST || process.env.DB_HOST || "localhost" : process.env.DB_HOST || "localhost";

if (!dbName || !dbUser) {
  throw new Error("server/.env must define DB_NAME and DB_USER (or *_TEST values for tests)");
}
if (!dbPass) {
  throw new Error("Set the MySQL password in server/.env: DB_PASS=... or DB_PASSWORD=... (or *_TEST values for tests)");
}

export const sequelize = new Sequelize(dbName, dbUser, dbPass, {
  host: dbHost,
  dialect: "mysql",
  logging: false,
});
