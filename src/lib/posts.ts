import type { MarkdownInstance } from "astro";
import type { Post } from "../types/posts";

type Frontmatter = {
  title: string;
  description: string;
  date: string;
  links?: { label: string; url: string }[];
};

export type PostSummary = Post & {
  slug: string;
  dateISO: string;
  isArchived: boolean;
  links?: { label: string; url: string }[];
};

export type PostEntry = PostSummary & {
  Content: MarkdownInstance<Frontmatter>["Content"];
};

const modules = import.meta.glob("../posts/**/*.md", { eager: true });

const formatDate = (isoDate: string) => {
  const normalized = isoDate.includes("T") ? isoDate : `${isoDate}T00:00:00Z`;
  const date = new Date(normalized);

  if (Number.isNaN(date.getTime())) {
    throw new Error(`Invalid post date: ${isoDate}`);
  }

  return new Intl.DateTimeFormat("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
    timeZone: "UTC",
  }).format(date);
};

const normalizeSlug = (path: string) =>
  path.replace("../posts/", "").replace(/\.md$/, "");

const allPosts: PostEntry[] = Object.entries(modules)
  .map(([path, mod]) => {
    const { frontmatter, Content } = mod as MarkdownInstance<Frontmatter>;

    if (!frontmatter?.title || !frontmatter?.description || !frontmatter?.date) {
      throw new Error(`Missing frontmatter in ${path}`);
    }

    const slug = normalizeSlug(path);
    const dateISO = frontmatter.date;

    const links = Array.isArray(frontmatter.links)
      ? frontmatter.links.filter(
          (link) => Boolean(link?.label) && Boolean(link?.url),
        )
      : undefined;

    return {
      title: frontmatter.title,
      description: frontmatter.description,
      date: formatDate(dateISO),
      dateISO,
      href: `/blog/${slug}`,
      slug,
      isArchived: slug === "archive" || slug.startsWith("archive/"),
      links,
      Content,
    };
  })
  .sort(
    (a, b) =>
      new Date(b.dateISO).getTime() - new Date(a.dateISO).getTime(),
  );

const postSummaries: PostSummary[] = allPosts.map(({ Content, ...summary }) => summary);

export { allPosts, postSummaries };
