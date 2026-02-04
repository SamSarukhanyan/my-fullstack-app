import dotenv from "dotenv";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const SERVER_ROOT = path.resolve(__dirname, "..");

export const paths = {
  serverRoot: SERVER_ROOT,
  uploadsDir: path.join(SERVER_ROOT, "uploads"),
  clientDistPath: path.resolve(SERVER_ROOT, "../client/dist"),
};

export function loadAppEnv() {
  const envPath =
    process.env.ENV_PATH ||
    (process.env.NODE_ENV === "test"
      ? path.join(SERVER_ROOT, ".env.test")
      : path.join(SERVER_ROOT, ".env"));
  dotenv.config({ path: envPath });
}

export function ensureUploadsDirs() {
  fs.mkdirSync(path.join(paths.uploadsDir, "posts"), { recursive: true });
  fs.mkdirSync(path.join(paths.uploadsDir, "avatars"), { recursive: true });
}
