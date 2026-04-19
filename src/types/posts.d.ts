export type PostLink = {
  label: string;
  url: string;
};

export type Post = {
  slug: string;
  title: string;
  description: string;
  date: string;
  dateISO: string;
  href: string;
  isArchived: boolean;
  links?: PostLink[];
};
