import { projects } from "../projects";
import type { LocalizedProject, ProjectId } from "../../types/projects";
import type { TranslationFn } from "./request";

type ProjectTitleKey = `projectsData.${ProjectId}.title`;
type ProjectDescriptionKey = `projectsData.${ProjectId}.description`;

export function getLocalizedProjects(t: TranslationFn): LocalizedProject[] {
  return projects.map((project) => ({
    ...project,
    title: t(`projectsData.${project.id}.title` as ProjectTitleKey),
    description: t(
      `projectsData.${project.id}.description` as ProjectDescriptionKey,
    ),
  }));
}
