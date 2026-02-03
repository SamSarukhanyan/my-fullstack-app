const path = require("path");
const dotenv = require("dotenv");

const envPath = process.env.ENV_PATH
  ? path.isAbsolute(process.env.ENV_PATH)
    ? process.env.ENV_PATH
    : path.resolve(process.cwd(), process.env.ENV_PATH)
  : path.resolve(__dirname, "../../.env");

dotenv.config({ path: envPath });

const base = {
  username: process.env.DB_USER,
  password: process.env.DB_PASS || process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  host: process.env.DB_HOST || "localhost",
  dialect: "mysql",
  logging: false,
};

module.exports = {
  development: base,
  production: base,
  test: {
    username: process.env.DB_USER_TEST || process.env.DB_USER,
    password:
      process.env.DB_PASS_TEST ||
      process.env.DB_PASSWORD_TEST ||
      process.env.DB_PASS ||
      process.env.DB_PASSWORD,
    database: process.env.DB_NAME_TEST || process.env.DB_NAME,
    host: process.env.DB_HOST_TEST || process.env.DB_HOST || "localhost",
    dialect: "mysql",
    logging: false,
  },
};
