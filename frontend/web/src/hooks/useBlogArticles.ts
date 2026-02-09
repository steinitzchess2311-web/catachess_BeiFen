/**
 * Custom hook for fetching paginated blog articles
 * Handles loading, error states, and pagination metadata
 */

import { useState, useEffect } from 'react';
import { blogApi } from '../utils/blogApi';
import { BlogArticle, BlogListParams } from '../types/blog';

interface UseBlogArticlesReturn {
  articles: BlogArticle[];
  loading: boolean;
  error: Error | null;
  pagination: {
    total: number;
    page: number;
    total_pages: number;
    has_next: boolean;
    has_prev: boolean;
  };
}

/**
 * Fetch blog articles with automatic refetch on parameter changes
 * @param params - Query parameters (category, search, page, page_size)
 * @returns Articles, loading state, error state, and pagination info
 */
export function useBlogArticles(params: BlogListParams): UseBlogArticlesReturn {
  const [articles, setArticles] = useState<BlogArticle[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [pagination, setPagination] = useState({
    total: 0,
    page: 1,
    total_pages: 1,
    has_next: false,
    has_prev: false
  });

  useEffect(() => {
    let cancelled = false;

    async function fetchArticles() {
      try {
        setLoading(true);
        const response = await blogApi.getArticles(params);

        if (!cancelled) {
          setArticles(response.items);
          setPagination({
            total: response.total,
            page: response.page,
            total_pages: response.total_pages,
            has_next: response.has_next,
            has_prev: response.has_prev
          });
          setError(null);
        }
      } catch (err) {
        if (!cancelled) {
          setError(err as Error);
          setArticles([]);
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    fetchArticles();

    // Cleanup function to prevent state updates after unmount
    return () => {
      cancelled = true;
    };
  }, [params.category, params.search, params.page, params.page_size]);

  return { articles, loading, error, pagination };
}
