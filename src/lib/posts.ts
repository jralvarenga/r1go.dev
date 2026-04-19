import { defaultLocale, type AppLocale } from "./i18n/request";
import { postsMarkdown } from "./i18n/markdown";
import { getLocalizedPath } from "./i18n/routing";
import {
  parsePostFrontmatter,
  type PostFrontmatter,
  type PostLink,
} from "./posts-schema";

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
  html: string;
};

const localeDateFormats: Record<AppLocale, string> = {
  en: "en-US",
  es: "es-ES",
};

export async function getPostDocumentIds() {
  const collection = await postsMarkdown.getCollection();
  const documentIds = await collection.listDocuments();
  const datedDocuments = await Promise.all(
    documentIds.map(async (documentId) => {
      const document = await collection.getDocument(documentId, {
        locale: defaultLocale,
      });

      return {
        id: documentId,
        frontmatter: parsePostFrontmatter(document.frontmatter),
      };
    }),
  );

  return datedDocuments
    .sort((a, b) => {
      return (
        new Date(b.frontmatter.date).getTime() -
        new Date(a.frontmatter.date).getTime()
      );
    })
    .map((document) => document.id);
}

export async function getPostSummaries(locale: AppLocale) {
  const documentIds = await getPostDocumentIds();

  const summaries = await Promise.all(
    documentIds.map(async (documentId) => {
      const document = await postsMarkdown.getDocument(documentId, { locale });
      const frontmatter = parsePostFrontmatter(document.frontmatter);

      return createPostSummary(document, frontmatter, locale);
    }),
  );

  return summaries;
}

export async function getPostBySlug(slug: string, locale: AppLocale) {
  const document = await postsMarkdown.compileDocument(slug, { locale });
  const frontmatter = parsePostFrontmatter(document.frontmatter);

  if (document.kind !== "md") {
    throw new Error(`Unsupported post format for "${slug}": ${document.kind}`);
  }

  return {
    ...createPostSummary(document, frontmatter, locale),
    html: document.html,
  } satisfies PostDocument;
}

function createPostSummary(
  document: {
    id: string;
    locale: AppLocale;
    requestedLocale: AppLocale;
    usedFallback: boolean;
  },
  frontmatter: PostFrontmatter,
  locale: AppLocale,
) {
  return {
    slug: document.id,
    title: frontmatter.title,
    description: frontmatter.description,
    date: formatDate(frontmatter.date, locale),
    dateISO: frontmatter.date,
    href: getLocalizedPath(locale, `/blog/${document.id}`),
    isArchived: isArchivedPost(document.id),
    links: frontmatter.links,
    locale: document.locale,
    requestedLocale: document.requestedLocale,
    usedFallback: document.usedFallback,
  } satisfies PostSummary;
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
