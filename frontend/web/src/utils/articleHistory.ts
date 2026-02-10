/**
 * Article History Management
 * Manages category last article and recent articles history
 */

const CATEGORY_LAST_ARTICLE_KEY = 'categoryLastArticle';
const RECENT_ARTICLES_KEY = 'recentArticles';

interface CategoryLastArticle {
  [category: string]: {
    id: string;
    timestamp: number;
  };
}

interface RecentArticle {
  id: string;
  title: string;
  category?: string;
  timestamp: number;
}

/**
 * Category Last Article - Remember last viewed article per category
 */

/**
 * Save the last article viewed in a specific category
 */
export function saveCategoryLastArticle(category: string | undefined, articleId: string): void {
  if (!category) return;

  const data = getCategoryLastArticleData();
  data[category] = {
    id: articleId,
    timestamp: Date.now(),
  };

  localStorage.setItem(CATEGORY_LAST_ARTICLE_KEY, JSON.stringify(data));
}

/**
 * Get the last article viewed in a specific category
 */
export function getCategoryLastArticle(category: string | undefined): string | null {
  if (!category) return null;

  const data = getCategoryLastArticleData();
  return data[category]?.id || null;
}

/**
 * Clear the last article record for a specific category
 */
export function clearCategoryLastArticle(category: string | undefined): void {
  if (!category) return;

  const data = getCategoryLastArticleData();
  delete data[category];

  localStorage.setItem(CATEGORY_LAST_ARTICLE_KEY, JSON.stringify(data));
}

/**
 * Get all category last article data
 */
function getCategoryLastArticleData(): CategoryLastArticle {
  const stored = localStorage.getItem(CATEGORY_LAST_ARTICLE_KEY);
  return stored ? JSON.parse(stored) : {};
}

/**
 * Recent Articles - Track last 5 viewed articles
 */

/**
 * Add an article to recent history (max 5 articles)
 */
export function addRecentArticle(article: Omit<RecentArticle, 'timestamp'>): void {
  const recent = getRecentArticles();

  // Remove duplicate if exists
  const filtered = recent.filter(a => a.id !== article.id);

  // Add to beginning
  filtered.unshift({
    ...article,
    timestamp: Date.now(),
  });

  // Keep only last 5
  const latest = filtered.slice(0, 5);

  localStorage.setItem(RECENT_ARTICLES_KEY, JSON.stringify(latest));
}

/**
 * Get recent articles (sorted by timestamp, newest first)
 */
export function getRecentArticles(): RecentArticle[] {
  const stored = localStorage.getItem(RECENT_ARTICLES_KEY);
  return stored ? JSON.parse(stored) : [];
}

/**
 * Clear all recent articles history
 */
export function clearRecentArticles(): void {
  localStorage.removeItem(RECENT_ARTICLES_KEY);
}
