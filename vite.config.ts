import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";

export default defineConfig({
  // Project Pages live at https://sbraciulis.github.io/gpx-text-routes/
  base: process.env.GITHUB_PAGES === "true" ? "/gpx-text-routes/" : "/",
  plugins: [react()],
  test: {
    environment: "node",
    include: ["src/**/*.test.ts"],
  },
});
