import { defineConfig } from "astro/config";

export default defineConfig({
  output: "static",
  site: process.env.APP_URL ?? "http://localhost:4321",
});
