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
import { ArticleCardProps } from "./types";
import { blogApi } from "../../../utils/blogApi";
import ArticleImage from "./ArticleImage";
import ArticleContent from "./ArticleContent";
import ArticleMeta from "./ArticleMeta";
import ActionButtons from "./ActionButtons";

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
  const deleteButtonRef = useRef<HTMLButtonElement>(null);

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
        !dialogRef.current.contains(event.target as Node) &&
        deleteButtonRef.current &&
        !deleteButtonRef.current.contains(event.target as Node)
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
          {/* Cover Image Section */}
          <ArticleImage
            imageUrl={article.cover_image_url}
            title={article.title}
            category={article.category}
            isPinned={article.is_pinned}
          />

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

            <ActionButtons
              canDelete={canDelete}
              canPin={canPin}
              isDeleting={isDeleting}
              isPinning={isPinning}
              isPinned={article.is_pinned}
              onDeleteClick={handleDeleteClick}
              onPinToggle={handlePinToggle}
              deleteButtonRef={deleteButtonRef}
              showDeleteConfirm={showDeleteConfirm}
              dialogRef={dialogRef}
              onConfirmDelete={confirmDelete}
              onCancelDelete={cancelDelete}
            />
          </div>
        </article>
      </Link>
    </>
  );
};

export default ArticleCard;
