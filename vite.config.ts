import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";

const root = dirname(fileURLToPath(import.meta.url));

// @ts-expect-error process is a nodejs global
const host = process.env.TAURI_DEV_HOST;

export default defineConfig(({ mode }) => ({
  plugins: [react()],
  base: "./",
  cacheDir: resolve(root, ".cache/vite"),
  clearScreen: false,
  server: {
    port: 1420,
    strictPort: true,
    host: host || false,
    hmr: host
      ? {
          protocol: "ws",
          host,
          port: 1421,
        }
      : undefined,
    watch: {
      ignored: ["**/src-tauri/**"],
    },
  },
  resolve: {
    alias: {
      "@": resolve(root, "./src"),
      "@erp/domain": resolve(root, "./packages/domain/src/index.ts"),
      "@erp/ui": resolve(root, "./packages/ui/src/index.tsx"),
      "@erp/mock-seed":
        mode === "production"
          ? resolve(root, "./src/infrastructure/mock-data/empty.ts")
          : resolve(root, "./src/infrastructure/mock-data/seed.ts"),
    },
  },
}));
