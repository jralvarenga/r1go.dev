import { getCollection, render } from "astro:content";
import { createContentCollectionHelpers } from "@better-translate/astro/content";

import { requestConfig } from "./request";

export const postsCollection = createContentCollectionHelpers(requestConfig, {
  collection: "posts",
  getCollection,
  render,
});
