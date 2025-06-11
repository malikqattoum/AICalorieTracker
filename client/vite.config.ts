import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "src"),
      "@shared": path.resolve(__dirname, "../shared"),
    },
  },
  css: {
    postcss: path.resolve(__dirname, "postcss.config.js"),
  },
  root: __dirname,
  build: {
    outDir: "../dist/public",
    emptyOutDir: true,
  },
});
