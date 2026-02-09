/**
 * Blog API client
 * Provides methods to interact with backend blog endpoints
 */

import { api } from '@ui/assets/api';
import { BlogArticle, PaginatedResponse, BlogListParams, BlogCategory } from '../types/blog';

const BASE_PATH = '/api/blogs';

/**
 * Blog API methods
 */
export const blogApi = {
  /**
   * Get paginated list of published articles
   * Supports category filtering and search
   * @param params - Query parameters for filtering and pagination
   * @returns Paginated response with articles
   */
  async getArticles(params: BlogListParams = {}): Promise<PaginatedResponse<BlogArticle>> {
    const query = new URLSearchParams();

    if (params.category) {
      query.append('category', params.category);
    }

    if (params.search) {
      query.append('search', params.search);
    }

    query.append('page', String(params.page || 1));
    query.append('page_size', String(params.page_size || 10));

    const response = await api.get(`${BASE_PATH}/articles?${query}`);
    return response;
  },

  /**
   * Get all pinned articles (for featured section)
   * @returns Array of pinned articles
   */
  async getPinnedArticles(): Promise<BlogArticle[]> {
    const response = await api.get(`${BASE_PATH}/articles/pinned`);
    return response;
  },

  /**
   * Get single article by ID
   * Automatically increments view count
   * @param id - Article ID
   * @returns Full article with content
   */
  async getArticle(id: string): Promise<BlogArticle> {
    const response = await api.get(`${BASE_PATH}/articles/${id}`);
    return response;
  },

  /**
   * Get list of all categories with article counts
   * @returns Array of categories
   */
  async getCategories(): Promise<BlogCategory[]> {
    const response = await api.get(`${BASE_PATH}/categories`);
    return response;
  }
};
