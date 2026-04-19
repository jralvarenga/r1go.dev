import { getRequestConfig } from "@better-translate/astro";
import { configureTranslations } from "@better-translate/core";

import en from "./messages/en";
import es from "./messages/es";

export const appLocales = ["en", "es"] as const;
export const defaultLocale = "en" as const;
export const localeCookieName = "r1go_locale";
export const localeCookieMaxAge = 60 * 60 * 24 * 365;

export type AppLocale = (typeof appLocales)[number];

export function isAppLocale(locale: string | undefined): locale is AppLocale {
  return appLocales.includes(locale as AppLocale);
}

export function getLocaleFromCookieHeader(cookieHeader?: string | null) {
  if (!cookieHeader) {
    return undefined;
  }

  for (const cookie of cookieHeader.split(";")) {
    const [rawName, ...rawValue] = cookie.trim().split("=");

    if (rawName !== localeCookieName) {
      continue;
    }

    const locale = decodeURIComponent(rawValue.join("="));

    if (isAppLocale(locale)) {
      return locale;
    }
  }

  return undefined;
}

export const translator = await configureTranslations({
  availableLocales: appLocales,
  defaultLocale,
  fallbackLocale: defaultLocale,
  languages: [
    {
      locale: "en",
      nativeLabel: "English",
      shortLabel: "EN",
    },
    {
      locale: "es",
      nativeLabel: "Español",
      shortLabel: "ES",
    },
  ],
  messages: {
    en,
    es,
  },
});

export type TranslationFn = typeof translator.t;

export const requestConfig = getRequestConfig(async () => ({
  translator,
}));
