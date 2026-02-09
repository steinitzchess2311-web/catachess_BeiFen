/**
 * CreateButton component - Floating Action Button for creating blogs
 * Shows for authenticated users with Editor or Admin role
 */

import React, { useState } from 'react';
import BlogEditor from './BlogEditor';
import { BlogArticle } from '../../types/blog';

interface CreateButtonProps {
  onArticleCreated?: (article: BlogArticle) => void;
}

/**
 * Floating action button that opens the blog editor
 * Displays at bottom-right corner of the page
 */
const CreateButton: React.FC<CreateButtonProps> = ({ onArticleCreated }) => {
  const [editorOpen, setEditorOpen] = useState(false);

  const handleArticleSaved = (article: BlogArticle) => {
    // Refresh the page or update the list
    onArticleCreated?.(article);

    // Show success message
    console.log('Article created successfully:', article);

    // Optional: reload the page to show new article
    window.location.reload();
  };

  return (
    <>
      {/* Floating Action Button */}
      <button
        onClick={() => setEditorOpen(true)}
        style={{
          position: 'fixed',
          bottom: '32px',
          right: '32px',
          width: '64px',
          height: '64px',
          backgroundColor: '#8b7355',
          color: 'white',
          border: 'none',
          borderRadius: '50%',
          fontSize: '2rem',
          fontWeight: 600,
          cursor: 'pointer',
          boxShadow: '0 4px 16px rgba(139, 115, 85, 0.4)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          transition: 'all 0.3s ease',
          zIndex: 1000
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.transform = 'scale(1.1)';
          e.currentTarget.style.boxShadow = '0 6px 24px rgba(139, 115, 85, 0.5)';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.transform = 'scale(1)';
          e.currentTarget.style.boxShadow = '0 4px 16px rgba(139, 115, 85, 0.4)';
        }}
        title="Create New Article"
      >
        +
      </button>

      {/* Blog Editor Modal */}
      <BlogEditor
        open={editorOpen}
        onOpenChange={setEditorOpen}
        onSaved={handleArticleSaved}
      />
    </>
  );
};

export default CreateButton;
