/**
 * ArticleCard component - Blog article preview card
 * Displays article preview with navigation to detail page
 * Includes delete/pin actions with permission checks
 */

import React, { useState } from "react";
import { Link } from "react-router-dom";
import { BlogArticle } from "../../types/blog";
import { blogApi } from "../../utils/blogApi";
import logoImage from "../../assets/logo.jpg";

type ViewMode = 'articles' | 'drafts' | 'my-published';

interface ArticleCardProps {
  article: BlogArticle;
  userRole?: string | null;
  viewMode?: ViewMode;
  onDelete?: (articleId: string) => void;
  onPinToggle?: (articleId: string) => void;
}

/**
 * Article preview card with link to full article
 * Shows cover image, title, subtitle, metadata, and action buttons
 */
const ArticleCard: React.FC<ArticleCardProps> = ({
  article,
  userRole,
  viewMode = 'articles',
  onDelete,
  onPinToggle,
}) => {
  const [isDeleting, setIsDeleting] = useState(false);
  const [isPinning, setIsPinning] = useState(false);

  const displayImage = article.cover_image_url || logoImage;

  // Format date to readable string
  const formattedDate = new Date(article.published_at).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  });

  // Map category codes to display labels
  const categoryLabels: { [key: string]: string } = {
    'about': 'About Us',
    'function': 'Function',
    'allblogs': 'Blog',
    'user': 'User'
  };

  // Permission checks
  const canDelete =
    userRole === 'admin' ||
    (userRole === 'editor' && (viewMode === 'drafts' || viewMode === 'my-published'));
  const canPin = userRole === 'admin';

  // Delete handler
  const handleDelete = async (e: React.MouseEvent) => {
    e.preventDefault(); // Prevent navigation
    e.stopPropagation();

    if (!window.confirm(`Are you sure you want to delete "${article.title}"?`)) {
      return;
    }

    setIsDeleting(true);
    try {
      await blogApi.deleteArticle(article.id);
      if (onDelete) {
        onDelete(article.id);
      }
    } catch (error) {
      console.error('Failed to delete article:', error);
      alert('Failed to delete article. Please try again.');
    } finally {
      setIsDeleting(false);
    }
  };

  // Pin handler
  const handlePinToggle = async (e: React.MouseEvent) => {
    e.preventDefault(); // Prevent navigation
    e.stopPropagation();

    setIsPinning(true);
    try {
      // If currently pinned, unpin (pin_order=0), else pin with order 1
      const newPinOrder = article.is_pinned ? 0 : 1;
      await blogApi.pinArticle(article.id, newPinOrder);
      if (onPinToggle) {
        onPinToggle(article.id);
      }
    } catch (error) {
      console.error('Failed to toggle pin:', error);
      alert('Failed to toggle pin. Please try again.');
    } finally {
      setIsPinning(false);
    }
  };

  return (
    <Link
      to={`/blogs/${article.id}`}
      style={{ textDecoration: 'none', display: 'block', height: '100%' }}
    >
      <article
        style={{
          background: "rgba(255, 255, 255, 0.9)",
          borderRadius: "12px",
          overflow: "hidden",
          boxShadow: "0 2px 12px rgba(0, 0, 0, 0.08)",
          transition: "all 0.3s ease",
          cursor: "pointer",
          height: "100%",
          display: "flex",
          flexDirection: "column",
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.transform = "translateY(-4px)";
          e.currentTarget.style.boxShadow = "0 8px 24px rgba(0, 0, 0, 0.12)";
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.transform = "translateY(0)";
          e.currentTarget.style.boxShadow = "0 2px 12px rgba(0, 0, 0, 0.08)";
        }}
      >
        {/* Cover Image */}
        <div
          style={{
            width: "100%",
            height: "200px",
            overflow: "hidden",
            position: "relative",
            backgroundColor: "#f5f5f5",
          }}
        >
          <img
            src={displayImage}
            alt={article.title}
            style={{
              width: "100%",
              height: "100%",
              objectFit: "cover",
              transition: "transform 0.3s ease",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = "scale(1.05)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = "scale(1)";
            }}
          />

          {/* Category Badge */}
          <div
            style={{
              position: "absolute",
              top: "12px",
              left: "12px",
              background: "rgba(139, 115, 85, 0.9)",
              color: "white",
              padding: "6px 14px",
              borderRadius: "6px",
              fontSize: "0.75rem",
              fontWeight: 600,
              letterSpacing: "0.5px",
              textTransform: "uppercase",
            }}
          >
            {categoryLabels[article.category] || article.category}
          </div>

          {/* Pinned Badge */}
          {article.is_pinned && (
            <div
              style={{
                position: "absolute",
                top: "12px",
                right: "12px",
                background: "rgba(255, 193, 7, 0.9)",
                color: "white",
                padding: "6px 10px",
                borderRadius: "6px",
                fontSize: "0.75rem",
                fontWeight: 600,
              }}
            >
              📌 Pinned
            </div>
          )}
        </div>

        {/* Content */}
        <div
          style={{
            padding: "20px",
            flex: 1,
            display: "flex",
            flexDirection: "column",
          }}
        >
          {/* Title */}
          <h3
            style={{
              fontSize: "1.3rem",
              fontWeight: 700,
              color: "#2c2c2c",
              marginBottom: "10px",
              lineHeight: "1.4",
              display: "-webkit-box",
              WebkitLineClamp: 2,
              WebkitBoxOrient: "vertical",
              overflow: "hidden",
              textOverflow: "ellipsis",
            }}
          >
            {article.title}
          </h3>

          {/* Subtitle */}
          <p
            style={{
              fontSize: "0.95rem",
              color: "#5a5a5a",
              lineHeight: "1.6",
              marginBottom: "16px",
              display: "-webkit-box",
              WebkitLineClamp: 3,
              WebkitBoxOrient: "vertical",
              overflow: "hidden",
              textOverflow: "ellipsis",
              flex: 1,
            }}
          >
            {article.subtitle}
          </p>

          {/* Footer Meta */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "12px",
              paddingTop: "12px",
              borderTop: "1px solid rgba(139, 115, 85, 0.1)",
              fontSize: "0.85rem",
              color: "#8b7355",
            }}
          >
            <span style={{ fontWeight: 600 }}>{article.author_name}</span>
            <span style={{ color: "#d0d0d0" }}>•</span>
            <span>{formattedDate}</span>
            {article.view_count > 0 && (
              <>
                <span style={{ color: "#d0d0d0" }}>•</span>
                <span>{article.view_count} views</span>
              </>
            )}
          </div>

          {/* Action Buttons */}
          {(canDelete || canPin) && (
            <div
              style={{
                display: "flex",
                gap: "8px",
                marginTop: "12px",
                paddingTop: "12px",
                borderTop: "1px solid rgba(139, 115, 85, 0.1)",
              }}
            >
              {canDelete && (
                <button
                  onClick={handleDelete}
                  disabled={isDeleting}
                  style={{
                    flex: 1,
                    padding: "8px 12px",
                    fontSize: "0.85rem",
                    fontWeight: 500,
                    fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
                    color: "#dc3545",
                    backgroundColor: "transparent",
                    border: "2px solid #dc3545",
                    borderRadius: "8px",
                    cursor: isDeleting ? "not-allowed" : "pointer",
                    opacity: isDeleting ? 0.6 : 1,
                    transition: "all 0.2s ease",
                  }}
                  onMouseEnter={(e) => {
                    if (!isDeleting) {
                      e.currentTarget.style.backgroundColor = "rgba(220, 53, 69, 0.1)";
                      e.currentTarget.style.transform = "scale(0.97)";
                    }
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = "transparent";
                    e.currentTarget.style.transform = "scale(1)";
                  }}
                  onMouseDown={(e) => {
                    if (!isDeleting) {
                      e.currentTarget.style.transform = "scale(0.95)";
                    }
                  }}
                  onMouseUp={(e) => {
                    if (!isDeleting) {
                      e.currentTarget.style.transform = "scale(0.97)";
                    }
                  }}
                >
                  {isDeleting ? "Deleting..." : "🗑️ Delete"}
                </button>
              )}
              {canPin && (
                <button
                  onClick={handlePinToggle}
                  disabled={isPinning}
                  style={{
                    flex: 1,
                    padding: "8px 12px",
                    fontSize: "0.85rem",
                    fontWeight: 500,
                    fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
                    color: article.is_pinned ? "#6c757d" : "#ffc107",
                    backgroundColor: "transparent",
                    border: `2px solid ${article.is_pinned ? "#6c757d" : "#ffc107"}`,
                    borderRadius: "8px",
                    cursor: isPinning ? "not-allowed" : "pointer",
                    opacity: isPinning ? 0.6 : 1,
                    transition: "all 0.2s ease",
                  }}
                  onMouseEnter={(e) => {
                    if (!isPinning) {
                      e.currentTarget.style.backgroundColor = article.is_pinned
                        ? "rgba(108, 117, 125, 0.1)"
                        : "rgba(255, 193, 7, 0.1)";
                      e.currentTarget.style.transform = "scale(0.97)";
                    }
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = "transparent";
                    e.currentTarget.style.transform = "scale(1)";
                  }}
                  onMouseDown={(e) => {
                    if (!isPinning) {
                      e.currentTarget.style.transform = "scale(0.95)";
                    }
                  }}
                  onMouseUp={(e) => {
                    if (!isPinning) {
                      e.currentTarget.style.transform = "scale(0.97)";
                    }
                  }}
                >
                  {isPinning
                    ? "..."
                    : article.is_pinned
                    ? "📌 Unpin"
                    : "📌 Pin"}
                </button>
              )}
            </div>
          )}
        </div>
      </article>
    </Link>
  );
};

export default ArticleCard;
