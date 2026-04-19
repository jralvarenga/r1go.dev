export type PostLink = {
  label: string;
  url: string;
};

export type PostFrontmatter = {
  title: string;
  description: string;
  date: string;
  links?: PostLink[];
};

export function parsePostFrontmatter(frontmatter: Record<string, unknown>) {
  if (!isRecord(frontmatter)) {
    throw new Error("Invalid post frontmatter: expected an object.");
  }

  const title = readRequiredString(frontmatter, "title");
  const description = readRequiredString(frontmatter, "description");
  const date = readRequiredString(frontmatter, "date");
  const links = readOptionalLinks(frontmatter.links);

  return {
    title,
    description,
    date,
    links,
  } satisfies PostFrontmatter;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function readRequiredString(
  frontmatter: Record<string, unknown>,
  key: string,
) {
  const value = frontmatter[key];

  if (typeof value !== "string" || value.trim().length === 0) {
    throw new Error(`Invalid post frontmatter: "${key}" must be a string.`);
  }

  return value;
}

function readOptionalLinks(value: unknown) {
  if (value === undefined) {
    return undefined;
  }

  if (!Array.isArray(value)) {
    throw new Error('Invalid post frontmatter: "links" must be an array.');
  }

  return value.map((item, index) => {
    if (!isRecord(item)) {
      throw new Error(
        `Invalid post frontmatter: "links[${index}]" must be an object.`,
      );
    }

    const label = readRequiredString(item, "label");
    const url = readRequiredString(item, "url");

    try {
      new URL(url);
    } catch {
      throw new Error(
        `Invalid post frontmatter: "links[${index}].url" must be a valid URL.`,
      );
    }

    return {
      label,
      url,
    } satisfies PostLink;
  });
}
