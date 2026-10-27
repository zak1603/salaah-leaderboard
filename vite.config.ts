/// <reference types="vitest/config" />
import { resolve } from "node:path"
import tailwindcss from "@tailwindcss/vite"
import react from "@vitejs/plugin-react"
import { defineConfig } from "vite"

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      "@": resolve(import.meta.dirname, "./src"),
    },
  },
  test: {
    environment: "jsdom",
    coverage: {
      provider: "v8",
      include: ["src/lib/**/*.ts"],
      // House rule: the points engine is fully covered.
      thresholds: {
        "src/lib/points.ts": { statements: 100, branches: 100, functions: 100, lines: 100 },
      },
    },
  },
})
