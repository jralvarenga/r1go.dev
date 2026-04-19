export type ProjectId = "budio" | "r1go-dev";

export type Project = {
  id: ProjectId;
  tech: string[];
  href: string;
  iconUrl?: string;
  github?: string;
};

export type LocalizedProject = Project & {
  title: string;
  description: string;
};
