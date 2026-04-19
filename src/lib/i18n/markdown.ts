import { createMarkdownServerHelpers } from "@better-translate/md/server";

import { requestConfig } from "./request";

export const postsMarkdown = createMarkdownServerHelpers(requestConfig, {
  rootDir: "./src/content/posts",
  extensions: [".md"],
});
