import express from "express";
import fs from "fs";
import path from "path";

/**
 * If client dist exists, serve it as static and SPA catch-all (/{*path}).
 * Express 5: catch-all uses /{*path}, not *.
 */
export function registerStaticAndSpa(app, paths) {
  const { clientDistPath } = paths;

  if (fs.existsSync(clientDistPath)) {
    app.use(express.static(clientDistPath));
    app.get("/{*path}", (req, res) => {
      if (req.path.startsWith("/api")) {
        return res.status(404).send("API route not found");
      }
      res.sendFile(path.join(clientDistPath, "index.html"));
    });
  }
}
