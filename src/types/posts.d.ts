export type Post = {
  title: string;
  description: string;
  date: string;
  href: string;
  links?: { label: string; url: string }[];
};
