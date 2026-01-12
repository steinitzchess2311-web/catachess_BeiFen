const cache = new Map<string, string>();

export async function loadHtml(path: string): Promise<string> {
  if (cache.has(path)) {
    return cache.get(path) as string;
  }
  const response = await fetch(path);
  const html = await response.text();
  cache.set(path, html);
  return html;
}

export function mountHtml(container: Element, html: string): void {
  container.innerHTML = html;
}
