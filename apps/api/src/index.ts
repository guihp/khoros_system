import { resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { config as loadDotenv } from "dotenv";
import { loadEnv } from "./config.js";
import { buildApp } from "./app.js";

/** Carrega `.env` da raiz do monorepo (apps/api/src → ../../..). */
loadDotenv({ path: resolve(fileURLToPath(new URL(".", import.meta.url)), "../../../.env") });

const env = loadEnv();
const app = await buildApp(env);

try {
  await app.listen({ port: env.PORT, host: env.HOST });
} catch (err) {
  app.log.error(err);
  process.exit(1);
}
