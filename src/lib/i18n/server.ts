import { createServerHelpers } from "@better-translate/astro";

import { requestConfig } from "./request";

export const {
  getAvailableLanguages,
  getLocale,
  getTranslations,
  getTranslator,
} = createServerHelpers(requestConfig);
