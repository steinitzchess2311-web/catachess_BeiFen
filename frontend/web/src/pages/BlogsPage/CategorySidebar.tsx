/**
 * CategorySidebar component - Blog navigation and search
 * Provides category filtering and search functionality
 */

import React, { useState, useEffect } from "react";
import * as Collapsible from "@radix-ui/react-collapsible";
import { ChevronDownIcon, ChevronRightIcon } from "@radix-ui/react-icons";
import pureLogo from "../../assets/chessortag_pure_logo.png";
import BlogEditor from "./BlogEditor";

type ViewMode = 'articles' | 'drafts' | 'my-published';

interface CategorySidebarProps {
  activeCategory?: string;  // Currently active category filter
  searchQuery?: string;      // Current search query
  onCategoryChange: (category: string | undefined) => void;  // Callback when category changes
  onSearchChange: (search: string) => void;  // Callback when search changes
  viewMode: ViewMode;  // Current view mode
  onViewModeChange: (mode: ViewMode) => void;  // Callback when view mode changes
  userRole: string | null;  // User role for permission checks
}

/**
 * Sidebar for blog navigation with category filtering and search
 */
const CategorySidebar: React.FC<CategorySidebarProps> = ({
  activeCategory,
  searchQuery: externalSearchQuery = "",
  onCategoryChange,
  onSearchChange,
  viewMode,
  onViewModeChange,
  userRole,
}) => {
  const [searchQuery, setSearchQuery] = useState<string>(externalSearchQuery);
  const [isOfficialOpen, setIsOfficialOpen] = useState<boolean>(false);
  const [showComingSoon, setShowComingSoon] = useState<boolean>(false);
  const [isShaking, setIsShaking] = useState<boolean>(false);
  const [editorOpen, setEditorOpen] = useState<boolean>(false);

  // Sync internal search state with external prop
  useEffect(() => {
    setSearchQuery(externalSearchQuery);
  }, [externalSearchQuery]);

  // Debounced search handler
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      onSearchChange(searchQuery);
    }, 500);  // 500ms debounce

    return () => clearTimeout(timeoutId);
  }, [searchQuery, onSearchChange]);

  const handleSearchClear = () => {
    setSearchQuery("");
  };

  const handleComingSoonClick = () => {
    setShowComingSoon(true);
    setTimeout(() => setShowComingSoon(false), 2000);
  };

  const handleUserBlogsClick = () => {
    // Users' Blogs is now enabled - navigate to user category
    handleCategoryClick('user');
  };

  // Handle category click
  const handleCategoryClick = (categoryId: string) => {
    // Map UI category IDs to API category values
    const categoryMap: { [key: string]: string | undefined } = {
      'about': 'about',
      'function': 'function',
      'allblogs': 'allblogs',
      'user': 'user',  // Users' Blogs category
    };

    onCategoryChange(categoryMap[categoryId]);
  };

  const officialSubItems = [
    { id: "about", label: "About Us" },
    { id: "function", label: "Function Intro" },
    { id: "allblogs", label: "All Blogs" },
  ];

  return (
    <>
      {/* Coming Soon Modal */}
      {showComingSoon && (
        <div
          style={{
            position: "fixed",
            top: "80px",
            left: "50%",
            transform: "translateX(-50%)",
            background: "rgba(44, 44, 44, 0.95)",
            color: "white",
            padding: "12px 32px",
            borderRadius: "8px",
            boxShadow: "0 4px 20px rgba(0, 0, 0, 0.25)",
            zIndex: 9999,
            fontSize: "1.3rem",
            fontWeight: 600,
            animation: "slideDown 0.3s ease",
          }}
        >
          Coming Soon ✨
        </div>
      )}

      <div
        style={{
          width: "280px",
          flexShrink: 0,
          background: "rgba(255, 255, 255, 0.85)",
          borderRadius: "12px",
          padding: "25px 0",
          boxShadow: "0 4px 20px rgba(0, 0, 0, 0.08)",
          position: "sticky",
          top: "0",
          alignSelf: "flex-start",
        }}
      >
        <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
          {/* Pinned Articles */}
          <button
            onClick={handleComingSoonClick}
            style={{
              background: activeCategory === "pinned" ? "rgba(139, 115, 85, 0.1)" : "transparent",
              border: "none",
              borderLeft: activeCategory === "pinned" ? "4px solid #8b7355" : "4px solid transparent",
              padding: "14px 25px",
              textAlign: "left",
              cursor: "pointer",
              fontSize: "0.95rem",
              fontWeight: activeCategory === "pinned" ? 600 : 500,
              color: activeCategory === "pinned" ? "#2c2c2c" : "#5a5a5a",
              transition: "all 0.2s ease",
              display: "flex",
              alignItems: "center",
              gap: "10px",
            }}
            onMouseEnter={(e) => {
              if (activeCategory !== "pinned") {
                e.currentTarget.style.background = "rgba(139, 115, 85, 0.05)";
              }
            }}
            onMouseLeave={(e) => {
              if (activeCategory !== "pinned") {
                e.currentTarget.style.background = "transparent";
              }
            }}
          >
            <span style={{ fontSize: "1.2rem" }}>📌</span>
            <span>Pinned Articles</span>
          </button>

          {/* Chessortag Official - Collapsible */}
          <Collapsible.Root open={isOfficialOpen} onOpenChange={setIsOfficialOpen}>
            <Collapsible.Trigger asChild>
              <button
                style={{
                  background: isOfficialOpen ? "rgba(139, 115, 85, 0.1)" : "transparent",
                  border: "none",
                  borderLeft: isOfficialOpen ? "4px solid #8b7355" : "4px solid transparent",
                  padding: "14px 25px",
                  textAlign: "left",
                  cursor: "pointer",
                  fontSize: "0.95rem",
                  fontWeight: isOfficialOpen ? 600 : 500,
                  color: isOfficialOpen ? "#2c2c2c" : "#5a5a5a",
                  transition: "all 0.2s ease",
                  display: "flex",
                  alignItems: "center",
                  gap: "10px",
                  width: "100%",
                }}
                onMouseEnter={(e) => {
                  if (!isOfficialOpen) {
                    e.currentTarget.style.background = "rgba(139, 115, 85, 0.05)";
                  }
                }}
                onMouseLeave={(e) => {
                  if (!isOfficialOpen) {
                    e.currentTarget.style.background = "transparent";
                  }
                }}
              >
                <img
                  src={pureLogo}
                  alt="Chessortag"
                  style={{
                    width: "24px",
                    height: "24px",
                    objectFit: "contain",
                  }}
                />
                <span style={{ flex: 1 }}>Chessortag Official</span>
                {isOfficialOpen ? (
                  <ChevronDownIcon style={{ width: "18px", height: "18px" }} />
                ) : (
                  <ChevronRightIcon style={{ width: "18px", height: "18px" }} />
                )}
              </button>
            </Collapsible.Trigger>

            <Collapsible.Content
              style={{
                overflow: "hidden",
                transition: "all 0.3s cubic-bezier(0.87, 0, 0.13, 1)",
              }}
            >
              <div
                style={{
                  paddingLeft: "54px",
                  paddingTop: "4px",
                  paddingBottom: "4px",
                }}
              >
                {officialSubItems.map((item) => (
                  <button
                    key={item.id}
                    onClick={() => handleCategoryClick(item.id)}
                    style={{
                      background: activeCategory === item.id ? "rgba(139, 115, 85, 0.08)" : "transparent",
                      border: "none",
                      padding: "10px 25px 10px 20px",
                      textAlign: "left",
                      cursor: "pointer",
                      fontSize: "0.9rem",
                      fontWeight: activeCategory === item.id ? 600 : 400,
                      color: activeCategory === item.id ? "#8b7355" : "#6a6a6a",
                      transition: "all 0.15s ease",
                      display: "block",
                      width: "100%",
                      borderRadius: "6px",
                      marginBottom: "2px",
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.background = "rgba(139, 115, 85, 0.08)";
                      e.currentTarget.style.color = "#8b7355";
                    }}
                    onMouseLeave={(e) => {
                      if (activeCategory !== item.id) {
                        e.currentTarget.style.background = "transparent";
                        e.currentTarget.style.color = "#6a6a6a";
                      }
                    }}
                  >
                    {item.label}
                  </button>
                ))}
              </div>
            </Collapsible.Content>
          </Collapsible.Root>

          {/* Users' Blogs */}
          <button
            onClick={handleUserBlogsClick}
            style={{
              background: activeCategory === "user" ? "rgba(139, 115, 85, 0.1)" : "transparent",
              border: "none",
              borderLeft: activeCategory === "user" ? "4px solid #8b7355" : "4px solid transparent",
              padding: "14px 25px",
              textAlign: "left",
              cursor: "pointer",
              fontSize: "0.95rem",
              fontWeight: activeCategory === "user" ? 600 : 500,
              color: activeCategory === "user" ? "#2c2c2c" : "#5a5a5a",
              transition: "all 0.2s ease",
              display: "flex",
              alignItems: "center",
              gap: "10px",
              width: "100%",
            }}
            onMouseEnter={(e) => {
              if (activeCategory !== "user") {
                e.currentTarget.style.background = "rgba(139, 115, 85, 0.05)";
              }
            }}
            onMouseLeave={(e) => {
              if (activeCategory !== "user") {
                e.currentTarget.style.background = "transparent";
              }
            }}
          >
            <span style={{ fontSize: "1.2rem" }}>✍️</span>
            <span style={{ flex: 1 }}>Users' Blogs</span>
          </button>
        </div>

        {/* Search Section */}
        <div
          style={{
            marginTop: "30px",
            paddingTop: "20px",
            borderTop: "1px solid rgba(139, 115, 85, 0.15)",
            paddingLeft: "25px",
            paddingRight: "25px",
          }}
        >
          <div
            style={{
              position: "relative",
              width: "100%",
            }}
          >
            <input
              type="text"
              placeholder="Search articles..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{
                width: "100%",
                padding: "8px 32px 8px 12px",
                border: "1px solid rgba(139, 115, 85, 0.3)",
                borderRadius: "6px",
                fontSize: "0.9rem",
                color: "#2c2c2c",
                backgroundColor: "rgba(255, 255, 255, 0.9)",
                boxSizing: "border-box",
                transition: "all 0.2s ease",
                outline: "none",
              }}
              onFocus={(e) => {
                e.currentTarget.style.borderColor = "#8b7355";
                e.currentTarget.style.boxShadow = "0 0 0 2px rgba(139, 115, 85, 0.1)";
              }}
              onBlur={(e) => {
                e.currentTarget.style.borderColor = "rgba(139, 115, 85, 0.3)";
                e.currentTarget.style.boxShadow = "none";
              }}
            />
            {searchQuery && (
              <button
                onClick={handleSearchClear}
                style={{
                  position: "absolute",
                  top: "50%",
                  right: "8px",
                  transform: "translateY(-50%)",
                  width: "20px",
                  height: "20px",
                  border: "none",
                  background: "rgba(139, 115, 85, 0.2)",
                  borderRadius: "50%",
                  fontSize: "14px",
                  lineHeight: "1",
                  color: "#5a5a5a",
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  transition: "background 0.2s ease",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = "rgba(139, 115, 85, 0.3)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = "rgba(139, 115, 85, 0.2)";
                }}
              >
                ×
              </button>
            )}
          </div>
        </div>

        {/* User Actions Section - Only show for Editor/Admin */}
        {(userRole === 'editor' || userRole === 'admin') && (
          <div
            style={{
              marginTop: "20px",
              paddingTop: "20px",
              borderTop: "1px solid rgba(139, 115, 85, 0.15)",
              paddingLeft: "25px",
              paddingRight: "25px",
            }}
          >
            {/* Create Button */}
            <button
              onClick={() => setEditorOpen(true)}
              style={{
                width: "100%",
                padding: "12px 16px",
                fontSize: "0.95rem",
                fontWeight: 500,
                fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
                color: "#4a9eff",
                backgroundColor: "transparent",
                border: "2px solid #4a9eff",
                borderRadius: "8px",
                cursor: "pointer",
                transition: "all 0.2s ease",
                marginBottom: "12px",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = "rgba(74, 158, 255, 0.08)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = "transparent";
              }}
              onMouseDown={(e) => {
                e.currentTarget.style.transform = "scale(0.97)";
              }}
              onMouseUp={(e) => {
                e.currentTarget.style.transform = "scale(1)";
              }}
            >
              + Create Article
            </button>

            {/* Draft Box Button */}
            <button
              onClick={() => onViewModeChange('drafts')}
              style={{
                width: "100%",
                padding: "10px 16px",
                fontSize: "0.9rem",
                fontWeight: 500,
                fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
                color: viewMode === 'drafts' ? "#8b7355" : "#5a5a5a",
                backgroundColor: viewMode === 'drafts' ? "rgba(139, 115, 85, 0.08)" : "transparent",
                border: "1px solid rgba(139, 115, 85, 0.3)",
                borderRadius: "6px",
                cursor: "pointer",
                transition: "all 0.2s ease",
                marginBottom: "8px",
                display: "flex",
                alignItems: "center",
                gap: "8px",
              }}
              onMouseEnter={(e) => {
                if (viewMode !== 'drafts') {
                  e.currentTarget.style.backgroundColor = "rgba(139, 115, 85, 0.05)";
                }
              }}
              onMouseLeave={(e) => {
                if (viewMode !== 'drafts') {
                  e.currentTarget.style.backgroundColor = "transparent";
                }
              }}
            >
              <span>📝</span>
              <span>Draft Box</span>
            </button>

            {/* My Published Blogs Button */}
            <button
              onClick={() => onViewModeChange('my-published')}
              style={{
                width: "100%",
                padding: "10px 16px",
                fontSize: "0.9rem",
                fontWeight: 500,
                fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
                color: viewMode === 'my-published' ? "#8b7355" : "#5a5a5a",
                backgroundColor: viewMode === 'my-published' ? "rgba(139, 115, 85, 0.08)" : "transparent",
                border: "1px solid rgba(139, 115, 85, 0.3)",
                borderRadius: "6px",
                cursor: "pointer",
                transition: "all 0.2s ease",
                display: "flex",
                alignItems: "center",
                gap: "8px",
              }}
              onMouseEnter={(e) => {
                if (viewMode !== 'my-published') {
                  e.currentTarget.style.backgroundColor = "rgba(139, 115, 85, 0.05)";
                }
              }}
              onMouseLeave={(e) => {
                if (viewMode !== 'my-published') {
                  e.currentTarget.style.backgroundColor = "transparent";
                }
              }}
            >
              <span>📚</span>
              <span>My Published Blogs</span>
            </button>
          </div>
        )}
      </div>

      {/* Blog Editor Dialog */}
      <BlogEditor
        open={editorOpen}
        onOpenChange={setEditorOpen}
        onSaved={() => {
          // Refresh the current view
          if (viewMode === 'drafts') {
            onViewModeChange('drafts');
          }
        }}
        userRole={userRole}
      />

      <style>
        {`
          @keyframes slideDown {
            from {
              opacity: 0;
              transform: translateX(-50%) translateY(-10px);
            }
            to {
              opacity: 1;
              transform: translateX(-50%) translateY(0);
            }
          }

          @keyframes shake {
            0%, 100% {
              transform: translateX(0);
            }
            10%, 30%, 50%, 70%, 90% {
              transform: translateX(-4px);
            }
            20%, 40%, 60%, 80% {
              transform: translateX(4px);
            }
          }
        `}
      </style>
    </>
  );
};

export default CategorySidebar;
