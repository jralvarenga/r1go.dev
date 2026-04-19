import type { AppLocale } from "./request";
import { site } from "../site";

export function getLocalizedPath(_locale: AppLocale, pathname = "/") {
  return normalizeRoutePath(pathname);
}

export function getLocalizedAbsolutePath(_locale: AppLocale, pathname = "/") {
  return new URL(normalizeRoutePath(pathname), site.siteUrl).toString();
}

export function getRoutePathFromUrl(pathname: string) {
  return normalizeRoutePath(pathname);
}

function normalizeRoutePath(pathname: string) {
  if (!pathname || pathname === "/") {
    return "/";
  }

  const normalized = pathname.replace(/\/+$/, "");

  return normalized.startsWith("/") ? normalized : `/${normalized}`;
}
