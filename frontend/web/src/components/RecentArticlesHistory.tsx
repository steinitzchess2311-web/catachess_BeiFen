/**
 * RecentArticlesHistory - Display recent 5 articles in a dialog
 * Uses design system from dialogBox components
 */

import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import * as Dialog from "@radix-ui/react-dialog";
import { CounterClockwiseClockIcon, Cross2Icon } from "@radix-ui/react-icons";
import { getRecentArticles } from "../utils/articleHistory";
import "./RecentArticlesHistory.css";

interface RecentArticle {
  id: string;
  title: string;
  category?: string;
  timestamp: number;
}

const RecentArticlesHistory: React.FC = () => {
  const [open, setOpen] = useState(false);
  const [recentArticles, setRecentArticles] = useState<RecentArticle[]>([]);
  const navigate = useNavigate();

  // Load recent articles when dialog opens
  useEffect(() => {
    if (open) {
      const articles = getRecentArticles();
      setRecentArticles(articles);
    }
  }, [open]);

  const handleArticleClick = (articleId: string) => {
    navigate(`/blogs/${articleId}`);
    setOpen(false);
  };

  // Format relative time (e.g., "2 minutes ago")
  const formatRelativeTime = (timestamp: number): string => {
    const now = Date.now();
    const diff = now - timestamp;
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 1) return "Just now";
    if (minutes < 60) return `${minutes} min ago`;
    if (hours < 24) return `${hours} hour${hours > 1 ? 's' : ''} ago`;
    return `${days} day${days > 1 ? 's' : ''} ago`;
  };

  return (
    <Dialog.Root open={open} onOpenChange={setOpen}>
      <Dialog.Trigger asChild>
        <button className="recent-articles-trigger" title="Recent Articles">
          <CounterClockwiseClockIcon width={18} height={18} />
        </button>
      </Dialog.Trigger>

      <Dialog.Portal>
        <Dialog.Overlay className="recent-articles-overlay" />
        <Dialog.Content className="recent-articles-content">
          <div className="recent-articles-header">
            <div className="recent-articles-icon">
              <CounterClockwiseClockIcon width={24} height={24} />
            </div>
            <Dialog.Title className="recent-articles-title">
              Recent Articles
            </Dialog.Title>
            <Dialog.Close asChild>
              <button className="recent-articles-close">
                <Cross2Icon width={16} height={16} />
              </button>
            </Dialog.Close>
          </div>

          <Dialog.Description className="recent-articles-description">
            Your browsing history (last 5 articles)
          </Dialog.Description>

          <div className="recent-articles-body">
            {recentArticles.length === 0 ? (
              <div className="recent-articles-empty">
                <CounterClockwiseClockIcon
                  width={48}
                  height={48}
                  className="recent-articles-empty-icon"
                />
                <p className="recent-articles-empty-title">
                  No recent articles yet
                </p>
                <p className="recent-articles-empty-subtitle">
                  Start reading to see your history here
                </p>
              </div>
            ) : (
              <ul className="recent-articles-list">
                {recentArticles.map((article, index) => (
                  <li key={article.id}>
                    <button
                      onClick={() => handleArticleClick(article.id)}
                      className="recent-articles-item"
                    >
                      <span className="recent-articles-item-number">
                        {index + 1}
                      </span>
                      <h3 className="recent-articles-item-title">
                        {article.title}
                      </h3>
                      <span className="recent-articles-item-time">
                        {formatRelativeTime(article.timestamp)}
                      </span>
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
};

export default RecentArticlesHistory;
