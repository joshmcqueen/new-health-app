import "dotenv/config";
import { buildApp } from "./app.js";

const app = await buildApp({ logger: true });
const port = Number(process.env.PORT || 3001);
const host = process.env.HOST || "0.0.0.0";

async function shutdown(signal: NodeJS.Signals) {
  app.log.info({ signal }, "Shutting down");
  try {
    await app.close();
    process.exit(0);
  } catch (error) {
    app.log.error(error);
    process.exit(1);
  }
}

for (const signal of ["SIGINT", "SIGTERM"] as const) {
  process.once(signal, () => { void shutdown(signal); });
}

try {
  await app.listen({ port, host });
} catch (error) {
  app.log.error(error);
  process.exit(1);
}
