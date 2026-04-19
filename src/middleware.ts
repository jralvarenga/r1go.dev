import { createBetterTranslateMiddleware } from "@better-translate/astro/middleware";

import {
  defaultLocale,
  getLocaleFromCookieHeader,
  requestConfig,
} from "./lib/i18n/request";

export const onRequest = createBetterTranslateMiddleware(requestConfig, {
  resolveLocale: ({ request }) =>
    getLocaleFromCookieHeader(request.headers.get("cookie")) ?? defaultLocale,
});
