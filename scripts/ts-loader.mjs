import { registerHooks } from "node:module";
import { existsSync } from "node:fs";
import { fileURLToPath } from "node:url";

const EXTENSIONS = [".ts", ".tsx", ".mts", ".js", ".mjs"];

registerHooks({
  resolve(specifier, context, nextResolve) {
    if (specifier.startsWith(".") && !/\.[cm]?[jt]sx?$/i.test(specifier) && context.parentURL) {
      for (const extension of EXTENSIONS) {
        try {
          const candidate = new URL(specifier + extension, context.parentURL);
          if (existsSync(fileURLToPath(candidate))) {
            return nextResolve(specifier + extension, context);
          }
        } catch {
          // ignore and keep trying
        }
      }
    }
    return nextResolve(specifier, context);
  },
});
