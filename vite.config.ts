import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";
import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "");
  const keyPath = resolve("certs/local-key.pem");
  const certPath = resolve("certs/local-cert.pem");
  const https = existsSync(keyPath) && existsSync(certPath)
    ? { key: readFileSync(keyPath), cert: readFileSync(certPath) }
    : undefined;
  return {
    plugins: [react()],
    server: {
      host: true,
      port: 5173,
      https,
      proxy: {
        "/api": `http://127.0.0.1:${env.PORT || 3001}`,
      },
    },
  };
});
