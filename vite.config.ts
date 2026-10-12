/// <reference types="vitest" />
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// `base: "./"` keeps the build relocatable (GitHub Pages sub-path or any static host).
export default defineConfig({
  base: "./",
  plugins: [react()],
  test: { environment: "node", include: ["src/**/*.test.ts"] },
});
