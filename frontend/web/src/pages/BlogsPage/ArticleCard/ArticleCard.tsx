/**
 * ArticleCard component - Main integration file
 * Displays blog article preview card with navigation, actions, and metadata
 *
 * This is the main component that orchestrates all sub-components:
 * - ArticleImage: Cover image with badges
 * - ArticleContent: Title and subtitle
 * - ArticleMeta: Author, date, view count
 * - ActionButtons: Delete and pin buttons
 * - DeleteConfirmDialog: Confirmation dialog
 */

import React, { useState, useRef, useEffect } from "react";
import { Link } from "react-router-dom";
import { TrashIcon, DrawingPinFilledIcon } from "@radix-ui/react-icons";
import { ArticleCardProps } from "./types";
import { blogApi } from "../../../utils/blogApi";
import ArticleImage from "./ArticleImage";
import ArticleContent from "./ArticleContent";
import ArticleMeta from "./ArticleMeta";
import DeleteConfirmDialog from "./DeleteConfirmDialog";

const ArticleCard: React.FC<ArticleCardProps> = ({
  article,
  userRole,
  viewMode = 'articles',
  onDelete,
  onPinToggle,
}) => {
  // State
  const [isDeleting, setIsDeleting] = useState(false);
  const [isPinning, setIsPinning] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  // Refs for dialog positioning and click-outside detection
  const dialogRef = useRef<HTMLDivElement>(null);

  // Permission checks
  const canDelete =
    userRole === 'admin' ||
    (userRole === 'editor' && (viewMode === 'drafts' || viewMode === 'my-published'));
  const canPin = userRole === 'admin';

  // Handle click outside dialog to close it
  useEffect(() => {
    if (!showDeleteConfirm) return;

    const handleClickOutside = (event: MouseEvent) => {
      if (
        dialogRef.current &&
        !dialogRef.current.contains(event.target as Node)
      ) {
        setShowDeleteConfirm(false);
      }
    };

    const timeoutId = setTimeout(() => {
      document.addEventListener('mousedown', handleClickOutside);
    }, 0);

    return () => {
      clearTimeout(timeoutId);
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showDeleteConfirm]);

  // Event handlers
  const handleDeleteClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setShowDeleteConfirm(true);
  };

  const confirmDelete = async () => {
    setShowDeleteConfirm(false);
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

  const cancelDelete = () => {
    setShowDeleteConfirm(false);
  };

  const handlePinToggle = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    setIsPinning(true);
    try {
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
    <>
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
            position: "relative",  // For action buttons positioning
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
          {/* Delete Confirmation Dialog */}
          <DeleteConfirmDialog
            show={showDeleteConfirm && canDelete}
            dialogRef={dialogRef}
            onConfirm={confirmDelete}
            onCancel={cancelDelete}
          />
          {/* Cover Image Section */}
          <ArticleImage
            imageUrl={article.cover_image_url}
            title={article.title}
            category={article.category}
            isPinned={article.is_pinned}
          />

          {/* Action Buttons - Below Image */}
          {(canDelete || canPin) && (
            <div
              style={{
                position: "absolute",
                top: "210px",
                right: "12px",
                display: "flex",
                gap: "8px",
                zIndex: 10,
              }}
            >
              {/* Delete Button */}
              {canDelete && (
                <button
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    handleDeleteClick(e);
                  }}
                  style={{
                    width: "36px",
                    height: "36px",
                    borderRadius: "50%",
                    border: "none",
                    backgroundColor: "rgba(150, 150, 150, 0.8)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    cursor: "pointer",
                    transition: "all 0.2s ease",
                    color: "white",
                    boxShadow: "0 2px 8px rgba(0,0,0,0.15)",
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = "rgba(220, 53, 69, 0.95)";
                    e.currentTarget.style.transform = "scale(1.1)";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = "rgba(150, 150, 150, 0.8)";
                    e.currentTarget.style.transform = "scale(1)";
                  }}
                >
                  <TrashIcon width={18} height={18} />
                </button>
              )}

              {/* Pin Button */}
              {canPin && (
                <button
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    handlePinToggle(e);
                  }}
                  style={{
                    width: "36px",
                    height: "36px",
                    borderRadius: "50%",
                    border: "none",
                    backgroundColor: article.is_pinned
                      ? "rgba(255, 193, 7, 0.95)"
                      : "rgba(150, 150, 150, 0.8)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    cursor: "pointer",
                    transition: "all 0.2s ease",
                    color: "white",
                    boxShadow: "0 2px 8px rgba(0,0,0,0.15)",
                  }}
                  onMouseEnter={(e) => {
                    if (!article.is_pinned) {
                      e.currentTarget.style.backgroundColor = "rgba(255, 193, 7, 0.95)";
                    }
                    e.currentTarget.style.transform = "scale(1.1)";
                  }}
                  onMouseLeave={(e) => {
                    if (!article.is_pinned) {
                      e.currentTarget.style.backgroundColor = "rgba(150, 150, 150, 0.8)";
                    }
                    e.currentTarget.style.transform = "scale(1)";
                  }}
                >
                  <DrawingPinFilledIcon width={18} height={18} />
                </button>
              )}
            </div>
          )}

          {/* Content Section */}
          <div
            style={{
              padding: "20px",
              flex: 1,
              display: "flex",
              flexDirection: "column",
            }}
          >
            <ArticleContent
              title={article.title}
              subtitle={article.subtitle}
            />

            <ArticleMeta
              authorName={article.author_name}
              publishedAt={article.published_at}
              viewCount={article.view_count}
            />
          </div>
        </article>
      </Link>
    </>
  );
};

export default ArticleCard;
