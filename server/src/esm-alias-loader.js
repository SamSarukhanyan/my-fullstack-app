// Custom ESM loader for alias resolution
// This file implements Node.js ESM loader hooks to resolve @ aliases
//src/esm-alias-loader.js

import { pathToFileURL, fileURLToPath } from "url";
import { resolve as resolvePath, dirname } from "path";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const projectRoot = resolvePath(__dirname, "..");

// Alias mappings - defined before use
const aliases = {
  "@modules": resolvePath(projectRoot, "src/modules"),
  "@modules/auth": resolvePath(projectRoot, "src/modules/auth"),
  "@modules/account": resolvePath(projectRoot, "src/modules/account"),
  "@middlewares": resolvePath(projectRoot, "src/middlewares"),
  "@utils": resolvePath(projectRoot, "src/utils"),
  "@config": resolvePath(projectRoot, "config"),
  "@db": resolvePath(projectRoot, "config/db"),
};

// ESM resolve hook
export async function resolve(specifier, context, nextResolve) {
  // Check for exact alias match
  if (aliases[specifier]) {
    const resolvedPath = resolvePath(aliases[specifier], "index.js");
    return {
      shortCircuit: true,
      url: pathToFileURL(resolvedPath).href,
    };
  }

  // Check for alias with path
  for (const [alias, aliasPath] of Object.entries(aliases)) {
    if (specifier.startsWith(alias + "/")) {
      const remaining = specifier.slice(alias.length + 1);
      const resolvedPath = resolvePath(aliasPath, remaining);
      return {
        shortCircuit: true,
        url: pathToFileURL(resolvedPath).href,
      };
    }
  }

  // Fall back to default resolution
  return nextResolve(specifier, context);
}
