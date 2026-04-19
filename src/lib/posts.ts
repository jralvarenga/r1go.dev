import type { CollectionEntry } from "astro:content";
import { getCollection } from "astro:content";

import { postsCollection } from "./i18n/content";
import { getLocalizedPath } from "./i18n/routing";
import type { AppLocale } from "./i18n/request";

export type PostEntry = CollectionEntry<"posts">;
export type PostLink = NonNullable<PostEntry["data"]["links"]>[number];

export type PostSummary = {
  slug: string;
  title: string;
  description: string;
  date: string;
  dateISO: string;
  href: string;
  isArchived: boolean;
  links?: PostLink[];
  locale: AppLocale;
  requestedLocale: AppLocale;
  usedFallback: boolean;
};

export type PostDocument = PostSummary & {
  Content: Awaited<
    ReturnType<typeof postsCollection.renderDocument>
  >["rendered"]["Content"];
};

const localeDateFormats: Record<AppLocale, string> = {
  en: "en-US",
  es: "es-ES",
};

export async function getPostDocumentIds() {
  const entries = await getCollection("posts");

  return entries
    .filter((entry) => entry.id.startsWith("en/"))
    .map((entry) => entry.id.slice(3))
    .sort((a, b) => {
      const entryA = entries.find((entry) => entry.id === `en/${a}`);
      const entryB = entries.find((entry) => entry.id === `en/${b}`);

      return (
        new Date(entryB?.data.date ?? 0).getTime() -
        new Date(entryA?.data.date ?? 0).getTime()
      );
    });
}

export async function getPostSummaries(locale: AppLocale) {
  const documentIds = await getPostDocumentIds();

  const summaries = await Promise.all(
    documentIds.map(async (documentId) => {
      const document = await postsCollection.getDocument(documentId, {
        locale,
      });

      return {
        slug: document.id,
        title: document.data.title,
        description: document.data.description,
        date: formatDate(document.data.date, locale),
        dateISO: document.data.date,
        href: getLocalizedPath(locale, `/blog/${document.id}`),
        isArchived: isArchivedPost(document.id),
        links: document.data.links,
        locale: document.locale,
        requestedLocale: document.requestedLocale,
        usedFallback: document.usedFallback,
      } satisfies PostSummary;
    }),
  );

  return summaries;
}

export async function getPostBySlug(slug: string, locale: AppLocale) {
  const document = await postsCollection.renderDocument(slug, { locale });

  return {
    slug: document.id,
    title: document.data.title,
    description: document.data.description,
    date: formatDate(document.data.date, locale),
    dateISO: document.data.date,
    href: getLocalizedPath(locale, `/blog/${document.id}`),
    isArchived: isArchivedPost(document.id),
    links: document.data.links,
    locale: document.locale,
    requestedLocale: document.requestedLocale,
    usedFallback: document.usedFallback,
    Content: document.rendered.Content,
  } satisfies PostDocument;
}

function formatDate(isoDate: string, locale: AppLocale) {
  const normalizedDate = isoDate.includes("T")
    ? isoDate
    : `${isoDate}T00:00:00Z`;
  const date = new Date(normalizedDate);

  if (Number.isNaN(date.getTime())) {
    throw new Error(`Invalid post date: ${isoDate}`);
  }

  return new Intl.DateTimeFormat(localeDateFormats[locale], {
    year: "numeric",
    month: "short",
    day: "numeric",
    timeZone: "UTC",
  }).format(date);
}

function isArchivedPost(slug: string) {
  return slug === "archive" || slug.startsWith("archive/");
}
