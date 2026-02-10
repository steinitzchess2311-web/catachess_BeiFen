/**
 * BlogsPage - Main blog listing page
 * Manages URL-based state for category filtering, search, and pagination
 */

import { useSearchParams, useParams, useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import PageTransition from "../../components/animation/PageTransition";
import CategorySidebar from "./CategorySidebar";
import ContentArea from "./ContentArea";
import BlogHeader from "../../components/BlogHeader";
import ArticleDetailPage from "./ArticleDetailPage";
import { api } from '@ui/assets/api';
import { useBlogArticle } from "../../hooks/useBlogArticle";

/**
 * Main blog page with sidebar navigation and article grid
 * Uses URL search params for state management (category, search, page)
 */
type ViewMode = 'articles' | 'drafts' | 'my-published';

const BlogsPage = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const { articleId } = useParams<{ articleId: string }>();
  const navigate = useNavigate();
  const [userRole, setUserRole] = useState<string | null>(null);
  const [userName, setUserName] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<ViewMode>('articles');
  const [sidebarOpen, setSidebarOpen] = useState<boolean>(true);

  // Check if we're in detail view
  const isDetailView = Boolean(articleId);

  // Fetch article data when in detail view (for header title)
  const { article, loading: articleLoading } = useBlogArticle(
    isDetailView ? articleId : undefined
  );

  // Auto-collapse sidebar when entering detail view
  useEffect(() => {
    if (isDetailView) {
      setSidebarOpen(false);
    } else {
      setSidebarOpen(true);
    }
  }, [isDetailView]);

  // Extract current state from URL params
  const category = searchParams.get('category') || undefined;
  const search = searchParams.get('search') || undefined;
  const page = parseInt(searchParams.get('page') || '1', 10);

  // Check user info on mount
  useEffect(() => {
    const checkUserInfo = async () => {
      try {
        const token = localStorage.getItem('catachess_token') || sessionStorage.getItem('catachess_token');
        if (!token) {
          setUserRole(null);
          setUserName(null);
          return;
        }

        const response = await api.request("/user/profile", {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        setUserRole(response.role || null);
        setUserName(response.username || null);
      } catch (error) {
        console.error("Failed to fetch user info:", error);
        setUserRole(null);
        setUserName(null);
      }
    };

    checkUserInfo();
  }, []);

  /**
   * Handle category filter change
   * Resets to page 1 when category changes
   * Clears articleId to return to list view
   */
  const handleCategoryChange = (newCategory: string | undefined) => {
    // Navigate to /blogs with new category (clears articleId from URL)
    const params = new URLSearchParams();

    if (newCategory) {
      params.set('category', newCategory);
    }

    if (search) {
      params.set('search', search);
    }

    params.set('page', '1');  // Reset to first page

    // Navigate to /blogs (without articleId in path)
    navigate(`/blogs?${params.toString()}`);
  };

  /**
   * Handle search query change
   * Resets to page 1 when search changes
   * Clears articleId to return to list view
   */
  const handleSearchChange = (newSearch: string) => {
    // Navigate to /blogs with new search (clears articleId from URL)
    const params = new URLSearchParams();

    if (category) {
      params.set('category', category);
    }

    if (newSearch) {
      params.set('search', newSearch);
    }

    params.set('page', '1');  // Reset to first page

    // Navigate to /blogs (without articleId in path)
    navigate(`/blogs?${params.toString()}`);
  };

  /**
   * Handle page number change
   * Preserves current category and search filters
   */
  const handlePageChange = (newPage: number) => {
    const params = new URLSearchParams(searchParams);
    params.set('page', String(newPage));
    setSearchParams(params);
  };

  return (
    <PageTransition>
      <div
        style={{
          padding: "40px 24px 70px",
          fontFamily: "'Roboto', sans-serif",
          background:
            "linear-gradient(135deg, rgba(250, 248, 245, 0.95) 0%, rgba(245, 242, 238, 0.95) 50%, rgba(242, 238, 233, 0.95) 100%)",
          minHeight: "calc(100vh - 64px)",
          overflowY: "auto",
        }}
      >
        <div
          style={{
            maxWidth: "1200px",
            margin: "0 auto",
          }}
        >
          {/* Main Layout: Sidebar + Content */}
          <div
            style={{
              display: "flex",
              gap: "30px",
              alignItems: "flex-start",
            }}
          >
            <CategorySidebar
              activeCategory={category}
              searchQuery={search}
              onCategoryChange={handleCategoryChange}
              onSearchChange={handleSearchChange}
              viewMode={viewMode}
              onViewModeChange={setViewMode}
              userRole={userRole}
              userName={userName}
              isOpen={sidebarOpen}
              onOpenChange={setSidebarOpen}
            />

            {/* Content Column: Header + Content */}
            <div style={{ flex: 1, display: "flex", flexDirection: "column" }}>
              <BlogHeader
                activeCategory={category}
                searchQuery={search}
                onSearchChange={handleSearchChange}
                viewMode={viewMode}
                isDetailView={isDetailView}
                onBackClick={() => navigate('/blogs')}
                articleTitle={article?.title}
                articleLoading={articleLoading}
              />

              {/* ContentArea handles both list and detail views */}
              <ContentArea
                category={category}
                search={search}
                page={page}
                onPageChange={handlePageChange}
                userRole={userRole}
                viewMode={viewMode}
                isDetailView={isDetailView}
                articleId={articleId}
                article={article}
                articleLoading={articleLoading}
              />
            </div>
          </div>
        </div>
      </div>
    </PageTransition>
  );
};

export default BlogsPage;
