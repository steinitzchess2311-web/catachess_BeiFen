/**
 * BlogHeader component - Category display and search bar
 * Non-floating header for blog content area
 */

import React from "react";

type ViewMode = 'articles' | 'drafts' | 'my-published';

interface BlogHeaderProps {
  activeCategory?: string;
  searchQuery?: string;
  onSearchChange: (search: string) => void;
  viewMode?: ViewMode;
}

const CATEGORY_LABELS: { [key: string]: string } = {
  'pinned': 'Pinned Articles',
  'about': 'Our Stories',
  'function': 'Functions Intro',
  'user': 'Community',
};

const VIEW_MODE_LABELS: { [key in ViewMode]: string } = {
  'articles': '',
  'drafts': 'Draft Box',
  'my-published': 'My Published Blogs',
};

const BlogHeader: React.FC<BlogHeaderProps> = ({
  activeCategory,
  searchQuery = "",
  onSearchChange,
  viewMode = 'articles',
}) => {
  const [localSearchQuery, setLocalSearchQuery] = React.useState(searchQuery);

  // Sync with external search query
  React.useEffect(() => {
    setLocalSearchQuery(searchQuery);
  }, [searchQuery]);

  // Debounced search
  React.useEffect(() => {
    const timeoutId = setTimeout(() => {
      onSearchChange(localSearchQuery);
    }, 500);

    return () => clearTimeout(timeoutId);
  }, [localSearchQuery, onSearchChange]);

  const handleSearchClear = () => {
    setLocalSearchQuery("");
  };

  // Determine label based on viewMode first, then category
  const getLabel = () => {
    if (viewMode !== 'articles' && VIEW_MODE_LABELS[viewMode]) {
      return VIEW_MODE_LABELS[viewMode];
    }
    if (activeCategory) {
      return CATEGORY_LABELS[activeCategory] || activeCategory;
    }
    // When no category selected, show Chessortag Official (all official blogs)
    return 'Chessortag Official';
  };

  const categoryLabel = getLabel();

  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        padding: "20px 30px",
        background: "rgba(255, 255, 255, 0.95)",
        borderRadius: "12px",
        marginBottom: "24px",
        boxShadow: "0 2px 12px rgba(0, 0, 0, 0.06)",
      }}
    >
      {/* Left: Category Label */}
      <div
        style={{
          fontSize: "1.5rem",
          fontWeight: 700,
          color: "#2c2c2c",
          display: "flex",
          alignItems: "center",
          gap: "12px",
        }}
      >
        <span>{categoryLabel}</span>
      </div>

      {/* Right: Search Bar */}
      <div
        style={{
          position: "relative",
          width: "320px",
        }}
      >
        <input
          type="text"
          placeholder="Search articles..."
          value={localSearchQuery}
          onChange={(e) => setLocalSearchQuery(e.target.value)}
          style={{
            width: "100%",
            padding: "10px 40px 10px 16px",
            border: "1px solid rgba(139, 115, 85, 0.3)",
            borderRadius: "8px",
            fontSize: "0.95rem",
            color: "#2c2c2c",
            backgroundColor: "rgba(255, 255, 255, 0.9)",
            boxSizing: "border-box",
            transition: "all 0.2s ease",
            outline: "none",
          }}
          onFocus={(e) => {
            e.currentTarget.style.borderColor = "#8b7355";
            e.currentTarget.style.boxShadow = "0 0 0 3px rgba(139, 115, 85, 0.1)";
          }}
          onBlur={(e) => {
            e.currentTarget.style.borderColor = "rgba(139, 115, 85, 0.3)";
            e.currentTarget.style.boxShadow = "none";
          }}
        />
        {localSearchQuery && (
          <button
            onClick={handleSearchClear}
            style={{
              position: "absolute",
              top: "50%",
              right: "12px",
              transform: "translateY(-50%)",
              width: "24px",
              height: "24px",
              border: "none",
              background: "rgba(139, 115, 85, 0.2)",
              borderRadius: "50%",
              fontSize: "16px",
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
  );
};

export default BlogHeader;
