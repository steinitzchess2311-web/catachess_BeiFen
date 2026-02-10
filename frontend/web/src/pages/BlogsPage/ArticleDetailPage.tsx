/**
 * ArticleDetailPage component - Full blog article view
 * Displays complete article with Markdown rendering
 */

import React from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useBlogArticle } from "../../hooks/useBlogArticle";
import MarkdownRenderer from "./components/MarkdownRenderer";
import LoadingState from "./components/LoadingState";
import ErrorState from "./components/ErrorState";
import PageTransition from "../../components/animation/PageTransition";

/**
 * Full article detail page with back navigation
 * Automatically increments view count on load
 */
const ArticleDetailPage: React.FC = () => {
  const { articleId } = useParams<{ articleId: string }>();
  const navigate = useNavigate();
  const { article, loading, error } = useBlogArticle(articleId);

  // Loading state
  if (loading) {
    return (
      <PageTransition>
        <div
          style={{
            minHeight: "100vh",
            background: "linear-gradient(135deg, #f8f4f0 0%, #e8ddd0 100%)",
            padding: "80px 24px 40px",
          }}
        >
          <LoadingState />
        </div>
      </PageTransition>
    );
  }

  // Error state
  if (error) {
    return (
      <PageTransition>
        <div
          style={{
            minHeight: "100vh",
            background: "linear-gradient(135deg, #f8f4f0 0%, #e8ddd0 100%)",
            padding: "80px 24px 40px",
          }}
        >
          <div style={{ maxWidth: "800px", margin: "0 auto" }}>
            <button
              onClick={() => navigate("/blogs")}
              style={{
                padding: "10px 20px",
                marginBottom: "20px",
                fontSize: "0.95rem",
                fontWeight: 500,
                color: "#2c2c2c",
                backgroundColor: "rgba(255, 255, 255, 0.9)",
                border: "1px solid #e0e0e0",
                borderRadius: "8px",
                cursor: "pointer",
                transition: "all 0.2s ease",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = "rgba(139, 115, 85, 0.1)";
                e.currentTarget.style.borderColor = "#8b7355";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = "rgba(255, 255, 255, 0.9)";
                e.currentTarget.style.borderColor = "#e0e0e0";
              }}
            >
              ← Back to Blogs
            </button>
            <ErrorState message="Failed to load article" />
          </div>
        </div>
      </PageTransition>
    );
  }

  // Not found state
  if (!article) {
    return (
      <PageTransition>
        <div
          style={{
            minHeight: "100vh",
            background: "linear-gradient(135deg, #f8f4f0 0%, #e8ddd0 100%)",
            padding: "80px 24px 40px",
          }}
        >
          <div
            style={{
              maxWidth: "800px",
              margin: "0 auto",
              textAlign: "center",
              padding: "60px 20px",
            }}
          >
            <h1 style={{ fontSize: "3rem", marginBottom: "20px" }}>404</h1>
            <p style={{ fontSize: "1.2rem", color: "#5a5a5a", marginBottom: "30px" }}>
              Article not found
            </p>
            <button
              onClick={() => navigate("/blogs")}
              style={{
                padding: "12px 30px",
                fontSize: "1rem",
                fontWeight: 600,
                color: "white",
                backgroundColor: "#8b7355",
                border: "none",
                borderRadius: "8px",
                cursor: "pointer",
                transition: "all 0.2s ease",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = "#6f5a43";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = "#8b7355";
              }}
            >
              Back to Blogs
            </button>
          </div>
        </div>
      </PageTransition>
    );
  }

  // Format date
  const formattedDate = new Date(article.published_at).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });

  return (
    <PageTransition>
      <div
        style={{
          minHeight: "100vh",
          background: "linear-gradient(135deg, #f8f4f0 0%, #e8ddd0 100%)",
          padding: "80px 24px 40px",
          overflowY: "auto",
        }}
      >
        <div style={{ maxWidth: "800px", margin: "0 auto" }}>
          {/* Back Button */}
          <button
            onClick={() => navigate("/blogs")}
            style={{
              padding: "10px 20px",
              marginBottom: "30px",
              fontSize: "0.95rem",
              fontWeight: 500,
              color: "#2c2c2c",
              backgroundColor: "rgba(255, 255, 255, 0.9)",
              border: "1px solid #e0e0e0",
              borderRadius: "8px",
              cursor: "pointer",
              transition: "all 0.2s ease",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = "rgba(139, 115, 85, 0.1)";
              e.currentTarget.style.borderColor = "#8b7355";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = "rgba(255, 255, 255, 0.9)";
              e.currentTarget.style.borderColor = "#e0e0e0";
            }}
          >
            ← Back to Blogs
          </button>

          {/* Article Container */}
          <article
            style={{
              background: "rgba(255, 255, 255, 0.95)",
              borderRadius: "12px",
              overflow: "hidden",
              boxShadow: "0 4px 20px rgba(0, 0, 0, 0.08)",
            }}
          >
            {/* Cover Image */}
            <div
              style={{
                width: "100%",
                height: "400px",
                overflow: "hidden",
                backgroundColor: "#f5f5f5",
              }}
            >
              <img
                src={article.cover_image_url}
                alt={article.title}
                style={{
                  width: "100%",
                  height: "100%",
                  objectFit: "cover",
                }}
              />
            </div>

            {/* Article Content */}
            <div style={{ padding: "40px" }}>
              {/* Title */}
              <h1
                style={{
                  fontSize: "2.5rem",
                  fontWeight: 700,
                  color: "#2c2c2c",
                  marginBottom: "12px",
                  lineHeight: "1.3",
                }}
              >
                {article.title}
              </h1>

              {/* Subtitle */}
              <h2
                style={{
                  fontSize: "1.3rem",
                  fontWeight: 400,
                  color: "#5a5a5a",
                  marginBottom: "24px",
                  lineHeight: "1.5",
                }}
              >
                {article.subtitle}
              </h2>

              {/* Metadata */}
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "16px",
                  paddingBottom: "24px",
                  marginBottom: "32px",
                  borderBottom: "2px solid rgba(139, 115, 85, 0.15)",
                  fontSize: "0.95rem",
                  color: "#8b7355",
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                  <span style={{ fontWeight: 600 }}>{article.author_name}</span>
                  <span
                    style={{
                      padding: "4px 8px",
                      backgroundColor: article.author_type === 'official'
                        ? "rgba(76, 175, 80, 0.1)"  // 绿色 - 官方文章
                        : "rgba(139, 115, 85, 0.1)",  // 棕色 - 用户投稿
                      borderRadius: "4px",
                      fontSize: "0.75rem",
                      fontWeight: 600,
                      textTransform: "uppercase",
                    }}
                  >
                    {article.author_type === 'official' ? 'Official' : 'User'}
                  </span>
                </div>
                <span style={{ color: "#d0d0d0" }}>•</span>
                <span>{formattedDate}</span>
                <span style={{ color: "#d0d0d0" }}>•</span>
                <span>{article.view_count} views</span>
              </div>

              {/* Tags */}
              {article.tags && article.tags.length > 0 && (
                <div
                  style={{
                    display: "flex",
                    flexWrap: "wrap",
                    gap: "8px",
                    marginBottom: "32px",
                  }}
                >
                  {article.tags.map((tag, index) => (
                    <span
                      key={index}
                      style={{
                        padding: "6px 14px",
                        backgroundColor: "rgba(139, 115, 85, 0.1)",
                        color: "#8b7355",
                        borderRadius: "20px",
                        fontSize: "0.85rem",
                        fontWeight: 500,
                      }}
                    >
                      #{tag}
                    </span>
                  ))}
                </div>
              )}

              {/* Article Content - Markdown */}
              {article.content && (
                <MarkdownRenderer content={article.content} />
              )}

              {/* Footer Stats */}
              <div
                style={{
                  marginTop: "40px",
                  paddingTop: "24px",
                  borderTop: "1px solid rgba(139, 115, 85, 0.15)",
                  display: "flex",
                  gap: "24px",
                  fontSize: "0.9rem",
                  color: "#8a8a8a",
                }}
              >
                <div>👁️ {article.view_count} views</div>
                <div>❤️ {article.like_count} likes</div>
                <div>💬 {article.comment_count} comments</div>
              </div>
            </div>
          </article>
        </div>
      </div>
    </PageTransition>
  );
};

export default ArticleDetailPage;
