export function extractMentions(content: string): string[] {
  const matches = content.match(/@([a-zA-Z0-9_]+)/g) || [];
  return matches.map((mention) => mention.slice(1));
}

export function matchMentionQuery(content: string): string | null {
  const match = content.match(/@([a-zA-Z0-9_]+)$/);
  return match ? match[1] : null;
}
