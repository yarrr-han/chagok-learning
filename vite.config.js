import { defineConfig } from "vite";

export default defineConfig({
  root: "src",
  publicDir: "../public",
  base: "./",
  esbuild: { jsx: "automatic" },
  build: { outDir: "../dist", emptyOutDir: true, sourcemap: true },
});
