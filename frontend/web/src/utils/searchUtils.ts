/**
 * Blog search utilities with fuzzy matching and relevance scoring
 */

export interface BlogArticle {
  id: string;
  title: string;
  content: string;
  category: string;
  tags?: string[];
  author?: string;
  createdAt?: string;
}

export interface SearchResult {
  article: BlogArticle;
  score: number;
  matchedFields: string[];
}

/**
 * Calculate Levenshtein distance between two strings
 * Used for fuzzy matching
 */
function levenshteinDistance(str1: string, str2: string): number {
  const len1 = str1.length;
  const len2 = str2.length;
  const matrix: number[][] = [];

  for (let i = 0; i <= len1; i++) {
    matrix[i] = [i];
  }

  for (let j = 0; j <= len2; j++) {
    matrix[0][j] = j;
  }

  for (let i = 1; i <= len1; i++) {
    for (let j = 1; j <= len2; j++) {
      const cost = str1[i - 1] === str2[j - 1] ? 0 : 1;
      matrix[i][j] = Math.min(
        matrix[i - 1][j] + 1, // deletion
        matrix[i][j - 1] + 1, // insertion
        matrix[i - 1][j - 1] + cost // substitution
      );
    }
  }

  return matrix[len1][len2];
}

/**
 * Calculate fuzzy match score (0-1, higher is better)
 */
function fuzzyMatchScore(query: string, target: string): number {
  const queryLower = query.toLowerCase();
  const targetLower = target.toLowerCase();

  // Exact match
  if (targetLower === queryLower) return 1.0;

  // Contains query as substring
  if (targetLower.includes(queryLower)) {
    const position = targetLower.indexOf(queryLower);
    const positionScore = 1 - position / targetLower.length;
    return 0.8 + positionScore * 0.2;
  }

  // Fuzzy match using Levenshtein distance
  const distance = levenshteinDistance(queryLower, targetLower);
  const maxLen = Math.max(queryLower.length, targetLower.length);
  const similarity = 1 - distance / maxLen;

  // Only consider matches with similarity > 0.5
  return similarity > 0.5 ? similarity * 0.6 : 0;
}

/**
 * Calculate relevance score for an article
 */
function calculateRelevance(article: BlogArticle, query: string): SearchResult {
  const matchedFields: string[] = [];
  let totalScore = 0;

  // Title match (highest weight: 5x)
  const titleScore = fuzzyMatchScore(query, article.title);
  if (titleScore > 0) {
    totalScore += titleScore * 5;
    matchedFields.push("title");
  }

  // Tags match (weight: 3x)
  if (article.tags) {
    const tagsText = article.tags.join(" ");
    const tagsScore = fuzzyMatchScore(query, tagsText);
    if (tagsScore > 0) {
      totalScore += tagsScore * 3;
      matchedFields.push("tags");
    }
  }

  // Category match (weight: 2x)
  const categoryScore = fuzzyMatchScore(query, article.category);
  if (categoryScore > 0) {
    totalScore += categoryScore * 2;
    matchedFields.push("category");
  }

  // Content match (weight: 1x)
  const contentScore = fuzzyMatchScore(query, article.content);
  if (contentScore > 0) {
    totalScore += contentScore;
    matchedFields.push("content");
  }

  // Author match (weight: 1.5x)
  if (article.author) {
    const authorScore = fuzzyMatchScore(query, article.author);
    if (authorScore > 0) {
      totalScore += authorScore * 1.5;
      matchedFields.push("author");
    }
  }

  return {
    article,
    score: totalScore,
    matchedFields,
  };
}

/**
 * Search articles with fuzzy matching and relevance scoring
 * @param articles - Array of blog articles to search
 * @param query - Search query string
 * @param minScore - Minimum relevance score threshold (default: 0.3)
 * @returns Sorted array of search results by relevance
 */
export function searchArticles(
  articles: BlogArticle[],
  query: string,
  minScore: number = 0.3
): SearchResult[] {
  // Empty query returns all articles
  if (!query.trim()) {
    return articles.map((article) => ({
      article,
      score: 0,
      matchedFields: [],
    }));
  }

  // Calculate relevance for each article
  const results = articles
    .map((article) => calculateRelevance(article, query))
    .filter((result) => result.score > minScore);

  // Sort by score (descending)
  results.sort((a, b) => b.score - a.score);

  return results;
}

/**
 * Highlight matched terms in text
 * @param text - Original text
 * @param query - Search query
 * @returns Text with <mark> tags around matches
 */
export function highlightMatches(text: string, query: string): string {
  if (!query.trim()) return text;

  const queryLower = query.toLowerCase();
  const textLower = text.toLowerCase();
  const index = textLower.indexOf(queryLower);

  if (index === -1) return text;

  return (
    text.slice(0, index) +
    '<mark>' +
    text.slice(index, index + query.length) +
    '</mark>' +
    text.slice(index + query.length)
  );
}

/**
 * Extract preview snippet from content with search term highlighted
 * @param content - Full content text
 * @param query - Search query
 * @param maxLength - Maximum snippet length (default: 200)
 * @returns Content snippet with highlighted term
 */
export function getContentSnippet(
  content: string,
  query: string,
  maxLength: number = 200
): string {
  if (!query.trim()) {
    return content.slice(0, maxLength) + (content.length > maxLength ? "..." : "");
  }

  const queryLower = query.toLowerCase();
  const contentLower = content.toLowerCase();
  const index = contentLower.indexOf(queryLower);

  if (index === -1) {
    return content.slice(0, maxLength) + (content.length > maxLength ? "..." : "");
  }

  // Center the snippet around the matched term
  const start = Math.max(0, index - Math.floor(maxLength / 2));
  const end = Math.min(content.length, start + maxLength);
  const snippet = content.slice(start, end);

  return (start > 0 ? "..." : "") + snippet + (end < content.length ? "..." : "");
}
