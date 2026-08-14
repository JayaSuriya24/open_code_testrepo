import { defineConfig } from "astro/config";
import preact from "@astrojs/preact";
import sitemap from "@astrojs/sitemap";

export default defineConfig({
  output: "static",
  site: process.env.APP_URL ?? "http://localhost:4321",
  integrations: [preact(), sitemap()],
});
