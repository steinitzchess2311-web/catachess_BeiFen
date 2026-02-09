/**
 * ContentArea component - Main blog article list display
 * Fetches and displays paginated blog articles with loading/error/empty states
 */

import React from "react";
import { useBlogArticles } from "../../hooks/useBlogArticles";
import ArticleCard from "./ArticleCard";
import LoadingState from "./components/LoadingState";
import EmptyState from "./components/EmptyState";
import ErrorState from "./components/ErrorState";
import Pagination from "./components/Pagination";
import CreateButton from "./CreateButton";

interface ContentAreaProps {
  category?: string;  // Category filter (about, function, allblogs)
  search?: string;    // Search query
  page?: number;      // Current page number
  onPageChange: (page: number) => void;  // Callback for page changes
  userRole?: string | null;  // User's role for showing create button
}

/**
 * Main content area that displays blog articles in a grid
 * Handles all data fetching and state management via useBlogArticles hook
 */
const ContentArea: React.FC<ContentAreaProps> = ({
  category,
  search,
  page = 1,
  onPageChange,
  userRole,
}) => {
  // Fetch articles with current filters
  const { articles, loading, error, pagination } = useBlogArticles({
    category,
    search,
    page,
    page_size: 10,
  });

  return (
    <div
      style={{
        flex: 1,
        position: "relative",  // For absolute positioning of CreateButton
        background: "rgba(255, 255, 255, 0.85)",
        borderRadius: "12px",
        padding: "40px",
        boxShadow: "0 4px 20px rgba(0, 0, 0, 0.08)",
        minHeight: "600px",
      }}
    >
      {/* Create Button - Only for Editor/Admin */}
      {(userRole === 'editor' || userRole === 'admin') && <CreateButton userRole={userRole} />}
      {/* Loading State */}
      {loading && <LoadingState />}

      {/* Error State */}
      {!loading && error && <ErrorState message={error.message} />}

      {/* Empty State */}
      {!loading && !error && articles.length === 0 && <EmptyState />}

      {/* Articles Grid */}
      {!loading && !error && articles.length > 0 && (
        <>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))",
              gap: "24px",
              marginBottom: "20px",
            }}
          >
            {articles.map((article) => (
              <ArticleCard key={article.id} article={article} />
            ))}
          </div>

          {/* Pagination Controls */}
          {pagination.total_pages > 1 && (
            <Pagination pagination={pagination} onPageChange={onPageChange} />
          )}
        </>
      )}
    </div>
  );
};

export default ContentArea;
