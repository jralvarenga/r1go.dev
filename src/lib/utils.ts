export function getFaviconUrl(href: string) {
  const hostname = new URL(href).hostname;
  return `https://www.google.com/s2/favicons?domain=${hostname}&sz=64`;
}
