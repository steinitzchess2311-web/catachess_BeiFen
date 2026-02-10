/**
 * RecentArticlesHistory - Display recent 5 articles in a dialog
 * Shows browsing history with clickable article titles
 */

import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import * as Dialog from "@radix-ui/react-dialog";
import { CounterClockwiseClockIcon, Cross2Icon } from "@radix-ui/react-icons";
import { getRecentArticles } from "../utils/articleHistory";

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
        <button
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            width: "36px",
            height: "36px",
            border: "1px solid rgba(139, 115, 85, 0.3)",
            borderRadius: "8px",
            backgroundColor: "rgba(255, 255, 255, 0.9)",
            cursor: "pointer",
            transition: "all 0.2s ease",
            color: "#8b7355",
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.borderColor = "#8b7355";
            e.currentTarget.style.backgroundColor = "rgba(139, 115, 85, 0.05)";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.borderColor = "rgba(139, 115, 85, 0.3)";
            e.currentTarget.style.backgroundColor = "rgba(255, 255, 255, 0.9)";
          }}
          title="Recent Articles"
        >
          <CounterClockwiseClockIcon width={18} height={18} />
        </button>
      </Dialog.Trigger>

      <Dialog.Portal>
        <Dialog.Overlay
          style={{
            position: "fixed",
            inset: 0,
            backgroundColor: "rgba(0, 0, 0, 0.5)",
            animation: "fadeIn 0.2s ease",
            zIndex: 1000,
          }}
        />
        <Dialog.Content
          style={{
            position: "fixed",
            top: "50%",
            left: "50%",
            transform: "translate(-50%, -50%)",
            backgroundColor: "white",
            borderRadius: "12px",
            padding: "24px",
            width: "90%",
            maxWidth: "500px",
            maxHeight: "80vh",
            overflowY: "auto",
            boxShadow: "0 10px 40px rgba(0, 0, 0, 0.2)",
            animation: "slideIn 0.2s ease",
            zIndex: 1001,
          }}
        >
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              marginBottom: "20px",
            }}
          >
            <Dialog.Title
              style={{
                fontSize: "1.5rem",
                fontWeight: 700,
                color: "#2c2c2c",
                margin: 0,
              }}
            >
              Recent Articles
            </Dialog.Title>
            <Dialog.Close asChild>
              <button
                style={{
                  width: "28px",
                  height: "28px",
                  border: "none",
                  background: "transparent",
                  borderRadius: "50%",
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  color: "#6a6a6a",
                  transition: "all 0.2s ease",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = "rgba(0, 0, 0, 0.05)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = "transparent";
                }}
              >
                <Cross2Icon width={16} height={16} />
              </button>
            </Dialog.Close>
          </div>

          <Dialog.Description
            style={{
              fontSize: "0.9rem",
              color: "#6a6a6a",
              marginBottom: "20px",
            }}
          >
            Your browsing history (last 5 articles)
          </Dialog.Description>

          {recentArticles.length === 0 ? (
            <div
              style={{
                textAlign: "center",
                padding: "40px 20px",
                color: "#9a9a9a",
              }}
            >
              <CounterClockwiseClockIcon
                width={48}
                height={48}
                style={{ margin: "0 auto 16px", opacity: 0.3 }}
              />
              <p style={{ fontSize: "1rem", margin: 0 }}>
                No recent articles yet
              </p>
              <p style={{ fontSize: "0.85rem", marginTop: "8px" }}>
                Start reading to see your history here
              </p>
            </div>
          ) : (
            <ul
              style={{
                listStyle: "none",
                padding: 0,
                margin: 0,
                display: "flex",
                flexDirection: "column",
                gap: "8px",
              }}
            >
              {recentArticles.map((article, index) => (
                <li key={article.id}>
                  <button
                    onClick={() => handleArticleClick(article.id)}
                    style={{
                      width: "100%",
                      padding: "16px",
                      border: "1px solid #e8e8e8",
                      borderRadius: "8px",
                      backgroundColor: "white",
                      cursor: "pointer",
                      textAlign: "left",
                      transition: "all 0.2s ease",
                      display: "flex",
                      flexDirection: "column",
                      gap: "8px",
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.borderColor = "#8b7355";
                      e.currentTarget.style.backgroundColor = "rgba(139, 115, 85, 0.03)";
                      e.currentTarget.style.transform = "translateX(4px)";
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.borderColor = "#e8e8e8";
                      e.currentTarget.style.backgroundColor = "white";
                      e.currentTarget.style.transform = "translateX(0)";
                    }}
                  >
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "8px",
                      }}
                    >
                      <span
                        style={{
                          fontSize: "0.75rem",
                          fontWeight: 600,
                          color: "#8b7355",
                          backgroundColor: "rgba(139, 115, 85, 0.1)",
                          padding: "2px 8px",
                          borderRadius: "4px",
                          minWidth: "20px",
                          textAlign: "center",
                        }}
                      >
                        {index + 1}
                      </span>
                      <span
                        style={{
                          fontSize: "0.75rem",
                          color: "#9a9a9a",
                        }}
                      >
                        {formatRelativeTime(article.timestamp)}
                      </span>
                    </div>
                    <h3
                      style={{
                        fontSize: "1rem",
                        fontWeight: 600,
                        color: "#2c2c2c",
                        margin: 0,
                        lineHeight: "1.4",
                      }}
                    >
                      {article.title}
                    </h3>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </Dialog.Content>
      </Dialog.Portal>

      <style>
        {`
          @keyframes fadeIn {
            from {
              opacity: 0;
            }
            to {
              opacity: 1;
            }
          }

          @keyframes slideIn {
            from {
              opacity: 0;
              transform: translate(-50%, -48%);
            }
            to {
              opacity: 1;
              transform: translate(-50%, -50%);
            }
          }
        `}
      </style>
    </Dialog.Root>
  );
};

export default RecentArticlesHistory;
