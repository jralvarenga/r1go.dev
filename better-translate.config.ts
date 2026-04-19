import { defineConfig } from "@better-translate/cli/config";
import { createOllama } from "ollama-ai-provider-v2";

const ollama = createOllama({
  baseURL: process.env.OLLAMA_BASE_URL ?? "http://localhost:11434/api",
});

export default defineConfig({
  sourceLocale: "en",
  locales: ["es"],
  model: ollama("kimi-k2.5:cloud"),
  messages: {
    entry: "./src/lib/i18n/messages/en.ts",
  },
  markdown: {
    rootDir: "./src/content/posts/en",
  },
});
