/**
 * BlogEditor component - Create/Edit blog articles
 * Uses Radix UI Dialog for modal interface
 */

import React, { useState, useEffect } from 'react';
import * as Dialog from '@radix-ui/react-dialog';
import * as Select from '@radix-ui/react-select';
import * as Label from '@radix-ui/react-label';
import { Cross2Icon, ChevronDownIcon, CheckIcon } from '@radix-ui/react-icons';
import { blogApi } from '../../utils/blogApi';
import { BlogArticle } from '../../types/blog';

interface BlogEditorProps {
  article?: BlogArticle;  // If editing existing article
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSaved?: (article: BlogArticle) => void;
  userRole?: string | null;  // User's role to determine category options
  userName?: string | null;  // Current user's name for author field
}

/**
 * Full-featured blog article editor with Markdown support
 * Supports create and edit modes
 */
const BlogEditor: React.FC<BlogEditorProps> = ({
  article,
  open,
  onOpenChange,
  onSaved,
  userRole,
  userName
}) => {
  const isEditMode = Boolean(article);
  const isAdmin = userRole === 'admin';

  // Form state
  const [title, setTitle] = useState('');
  const [subtitle, setSubtitle] = useState('');
  const [content, setContent] = useState('');
  const [coverImageUrl, setCoverImageUrl] = useState('');
  const [authorType, setAuthorType] = useState<'official' | 'user'>('official');  // official: 官方文章 | user: 用户投稿
  // Default category: admin can choose, others default to 'user'
  const [category, setCategory] = useState(isAdmin ? 'allblogs' : 'user');
  const [tags, setTags] = useState('');
  const [status, setStatus] = useState<'draft' | 'published'>('draft');
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  // Initialize form from existing article
  useEffect(() => {
    if (article) {
      setTitle(article.title);
      setSubtitle(article.subtitle || '');
      setContent(article.content || '');
      setCoverImageUrl(article.cover_image_url || '');
      setAuthorType(article.author_type);
      setCategory(article.category);
      setTags(article.tags?.join(', ') || '');
      setStatus(article.status as 'draft' | 'published');
    } else {
      // Reset form for new article
      setTitle('');
      setSubtitle('');
      setContent('');
      setCoverImageUrl('');
      setAuthorType('official');  // official: 官方文章
      // Default category based on role
      setCategory(isAdmin ? 'allblogs' : 'user');
      setTags('');
      setStatus('draft');
    }
    setError('');
  }, [article, open]);

  // Handle image upload
  const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      setError('Please select an image file');
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      setError('Image must be less than 5MB');
      return;
    }

    try {
      setUploading(true);
      setError('');
      const result = await blogApi.uploadImage(file);
      setCoverImageUrl(result.url);
    } catch (err: any) {
      setError(err.message || 'Failed to upload image');
    } finally {
      setUploading(false);
    }
  };

  // Handle save
  const handleSave = async (saveStatus: 'draft' | 'published') => {
    // Validation
    if (!title.trim()) {
      setError('Title is required');
      return;
    }
    if (!content.trim()) {
      setError('Content is required');
      return;
    }

    try {
      setSaving(true);
      setError('');

      const articleData = {
        title: title.trim(),
        subtitle: subtitle.trim() || undefined,
        content: content.trim(),
        cover_image_url: coverImageUrl || undefined,
        author_name: userName || undefined,  // Use current user's username
        author_type: authorType,
        category,
        tags: tags
          ? tags.split(',').map(t => t.trim()).filter(Boolean)
          : [],
        status: saveStatus
      };

      let savedArticle: BlogArticle;
      if (isEditMode && article) {
        savedArticle = await blogApi.updateArticle(article.id, articleData);
      } else {
        savedArticle = await blogApi.createArticle(articleData);
      }

      onSaved?.(savedArticle);
      onOpenChange(false);
    } catch (err: any) {
      setError(err.message || 'Failed to save article');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.5)',
            animation: 'fadeIn 0.2s ease',
            zIndex: 9998
          }}
        />
        <Dialog.Content
          style={{
            position: 'fixed',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            width: '90vw',
            maxWidth: '900px',
            maxHeight: '85vh',
            backgroundColor: 'white',
            borderRadius: '8px',
            padding: '24px',
            boxShadow: '0 4px 20px rgba(0, 0, 0, 0.15)',
            animation: 'slideUp 0.3s ease',
            zIndex: 9999,
            overflow: 'auto',
            fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", sans-serif'
          }}
        >
          {/* Header */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
            <Dialog.Title style={{ fontSize: '1.8rem', fontWeight: 700, color: '#2c2c2c' }}>
              {isEditMode ? 'Edit Article' : 'Create New Article'}
            </Dialog.Title>
            <Dialog.Close asChild>
              <button
                style={{
                  border: 'none',
                  background: 'transparent',
                  cursor: 'pointer',
                  padding: '8px',
                  borderRadius: '4px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}
                onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#f0f0f0'}
                onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
              >
                <Cross2Icon width={20} height={20} />
              </button>
            </Dialog.Close>
          </div>

          {/* Error Message */}
          {error && (
            <div
              style={{
                padding: '12px 16px',
                backgroundColor: '#ffebee',
                color: '#d32f2f',
                borderRadius: '8px',
                marginBottom: '16px',
                fontSize: '0.95rem'
              }}
            >
              {error}
            </div>
          )}

          {/* Form */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            {/* Title */}
            <div>
              <Label.Root htmlFor="title" style={{ fontSize: '0.95rem', fontWeight: 600, color: '#2c2c2c', marginBottom: '8px', display: 'block' }}>
                Title *
              </Label.Root>
              <input
                id="title"
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Enter article title..."
                style={{
                  width: '100%',
                  padding: '12px',
                  fontSize: '1rem',
                  border: '1px solid #e0e0e0',
                  borderRadius: '8px',
                  outline: 'none',
                  transition: 'border-color 0.2s'
                }}
                onFocus={(e) => e.currentTarget.style.borderColor = '#8b7355'}
                onBlur={(e) => e.currentTarget.style.borderColor = '#e0e0e0'}
              />
            </div>

            {/* Subtitle */}
            <div>
              <Label.Root htmlFor="subtitle" style={{ fontSize: '0.95rem', fontWeight: 600, color: '#2c2c2c', marginBottom: '8px', display: 'block' }}>
                Subtitle
              </Label.Root>
              <input
                id="subtitle"
                type="text"
                value={subtitle}
                onChange={(e) => setSubtitle(e.target.value)}
                placeholder="Enter subtitle (optional)..."
                style={{
                  width: '100%',
                  padding: '12px',
                  fontSize: '1rem',
                  border: '1px solid #e0e0e0',
                  borderRadius: '8px',
                  outline: 'none',
                  transition: 'border-color 0.2s'
                }}
                onFocus={(e) => e.currentTarget.style.borderColor = '#8b7355'}
                onBlur={(e) => e.currentTarget.style.borderColor = '#e0e0e0'}
              />
            </div>

            {/* Category and Author Type Row */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
              {/* Category */}
              <div>
                <Label.Root style={{ fontSize: '0.95rem', fontWeight: 600, color: '#2c2c2c', marginBottom: '8px', display: 'block' }}>
                  Category *
                </Label.Root>
                {isAdmin ? (
                  // Admin: Can choose between Official (About/Function/All Blogs) or User category
                  <Select.Root value={category} onValueChange={setCategory}>
                    <Select.Trigger
                      style={{
                        width: '100%',
                        padding: '12px',
                        fontSize: '1rem',
                        border: '1px solid #e0e0e0',
                        borderRadius: '8px',
                        backgroundColor: 'white',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        cursor: 'pointer'
                      }}
                    >
                      <Select.Value />
                      <Select.Icon>
                        <ChevronDownIcon />
                      </Select.Icon>
                    </Select.Trigger>
                    <Select.Portal>
                      <Select.Content
                        style={{
                          backgroundColor: 'white',
                          borderRadius: '8px',
                          boxShadow: '0 4px 20px rgba(0,0,0,0.15)',
                          padding: '8px',
                          zIndex: 10000
                        }}
                      >
                        <Select.Viewport>
                          <Select.Group>
                            <Select.Label style={{ padding: '8px 12px', fontSize: '0.8rem', color: '#8b7355', fontWeight: 700 }}>
                              📖 ChessorTag Official
                            </Select.Label>
                            <SelectItem value="about">Our Stories</SelectItem>
                            <SelectItem value="function">Function Intro</SelectItem>
                          </Select.Group>
                          <Select.Separator style={{ height: '1px', backgroundColor: '#e0e0e0', margin: '8px 0' }} />
                          <Select.Group>
                            <Select.Label style={{ padding: '8px 12px', fontSize: '0.8rem', color: '#8b7355', fontWeight: 700 }}>
                              ✍️ Users' Blogs
                            </Select.Label>
                            <SelectItem value="user">User Content</SelectItem>
                          </Select.Group>
                        </Select.Viewport>
                      </Select.Content>
                    </Select.Portal>
                  </Select.Root>
                ) : (
                  // Non-admin: Fixed to User category
                  <div style={{
                    width: '100%',
                    padding: '12px',
                    fontSize: '1rem',
                    border: '1px solid #e0e0e0',
                    borderRadius: '8px',
                    backgroundColor: '#f5f5f5',
                    color: '#5a5a5a'
                  }}>
                    ✍️ Users' Blogs (User Content)
                  </div>
                )}
              </div>

              {/* Author Type */}
              <div>
                <Label.Root style={{ fontSize: '0.95rem', fontWeight: 600, color: '#2c2c2c', marginBottom: '8px', display: 'block' }}>
                  Author Type
                </Label.Root>
                <Select.Root value={authorType} onValueChange={(val) => setAuthorType(val as 'official' | 'user')}>
                  <Select.Trigger
                    style={{
                      width: '100%',
                      padding: '12px',
                      fontSize: '1rem',
                      border: '1px solid #e0e0e0',
                      borderRadius: '8px',
                      backgroundColor: 'white',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      cursor: 'pointer'
                    }}
                  >
                    <Select.Value />
                    <Select.Icon>
                      <ChevronDownIcon />
                    </Select.Icon>
                  </Select.Trigger>
                  <Select.Portal>
                    <Select.Content
                      style={{
                        backgroundColor: 'white',
                        borderRadius: '8px',
                        boxShadow: '0 4px 20px rgba(0,0,0,0.15)',
                        padding: '8px',
                        zIndex: 10000
                      }}
                    >
                      <Select.Viewport>
                        <SelectItem value="official">📖 Official (ChessorTag)</SelectItem>
                        <SelectItem value="user">✍️ User Contribution</SelectItem>
                      </Select.Viewport>
                    </Select.Content>
                  </Select.Portal>
                </Select.Root>
              </div>
            </div>

            {/* Cover Image */}
            <div>
              <Label.Root htmlFor="coverImage" style={{ fontSize: '0.95rem', fontWeight: 600, color: '#2c2c2c', marginBottom: '8px', display: 'block' }}>
                Cover Image
              </Label.Root>
              <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                <input
                  id="coverImage"
                  type="file"
                  accept="image/*"
                  onChange={handleImageUpload}
                  disabled={uploading}
                  style={{ display: 'none' }}
                />
                <label
                  htmlFor="coverImage"
                  style={{
                    padding: '12px 24px',
                    fontSize: '0.95rem',
                    fontWeight: 500,
                    color: '#2c2c2c',
                    backgroundColor: '#f0f0f0',
                    border: 'none',
                    borderRadius: '8px',
                    cursor: uploading ? 'not-allowed' : 'pointer',
                    opacity: uploading ? 0.5 : 1
                  }}
                >
                  {uploading ? 'Uploading...' : 'Upload Image'}
                </label>
                {coverImageUrl && (
                  <span style={{ fontSize: '0.9rem', color: '#5a5a5a' }}>
                    ✓ Image uploaded
                  </span>
                )}
              </div>
              {coverImageUrl && (
                <img
                  src={coverImageUrl}
                  alt="Cover preview"
                  style={{
                    marginTop: '12px',
                    maxWidth: '200px',
                    maxHeight: '150px',
                    borderRadius: '8px',
                    objectFit: 'cover'
                  }}
                />
              )}
            </div>

            {/* Tags */}
            <div>
              <Label.Root htmlFor="tags" style={{ fontSize: '0.95rem', fontWeight: 600, color: '#2c2c2c', marginBottom: '8px', display: 'block' }}>
                Tags
              </Label.Root>
              <input
                id="tags"
                type="text"
                value={tags}
                onChange={(e) => setTags(e.target.value)}
                placeholder="Enter tags separated by commas (e.g., tutorial, chess, beginner)"
                style={{
                  width: '100%',
                  padding: '12px',
                  fontSize: '1rem',
                  border: '1px solid #e0e0e0',
                  borderRadius: '8px',
                  outline: 'none',
                  transition: 'border-color 0.2s'
                }}
                onFocus={(e) => e.currentTarget.style.borderColor = '#8b7355'}
                onBlur={(e) => e.currentTarget.style.borderColor = '#e0e0e0'}
              />
            </div>

            {/* Content (Markdown) */}
            <div>
              <Label.Root htmlFor="content" style={{ fontSize: '0.95rem', fontWeight: 600, color: '#2c2c2c', marginBottom: '8px', display: 'block' }}>
                Content (Markdown) *
              </Label.Root>
              <textarea
                id="content"
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder="Write your article content in Markdown format...&#10;&#10;Example:&#10;# Heading&#10;&#10;**Bold text** and *italic text*&#10;&#10;- List item 1&#10;- List item 2"
                rows={15}
                style={{
                  width: '100%',
                  padding: '12px',
                  fontSize: '1rem',
                  border: '1px solid #e0e0e0',
                  borderRadius: '8px',
                  outline: 'none',
                  transition: 'border-color 0.2s',
                  fontFamily: 'monospace',
                  resize: 'vertical'
                }}
                onFocus={(e) => e.currentTarget.style.borderColor = '#8b7355'}
                onBlur={(e) => e.currentTarget.style.borderColor = '#e0e0e0'}
              />
            </div>

            {/* Actions */}
            <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end', marginTop: '16px' }}>
              <button
                onClick={() => handleSave('draft')}
                disabled={saving || uploading}
                style={{
                  flex: 1,
                  padding: '10px 16px',
                  fontSize: '0.95rem',
                  fontWeight: 500,
                  fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
                  color: '#8b7355',
                  backgroundColor: 'transparent',
                  border: '2px solid #8b7355',
                  borderRadius: '8px',
                  cursor: saving || uploading ? 'not-allowed' : 'pointer',
                  opacity: saving || uploading ? 0.5 : 1,
                  transition: 'all 0.2s ease'
                }}
                onMouseEnter={(e) => {
                  if (!saving && !uploading) {
                    e.currentTarget.style.backgroundColor = 'rgba(139, 115, 85, 0.08)';
                  }
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = 'transparent';
                }}
                onMouseDown={(e) => {
                  if (!saving && !uploading) {
                    e.currentTarget.style.transform = 'scale(0.97)';
                  }
                }}
                onMouseUp={(e) => {
                  e.currentTarget.style.transform = 'scale(1)';
                }}
              >
                {saving ? 'Saving...' : 'Save and Exit'}
              </button>
              <button
                onClick={() => handleSave('published')}
                disabled={saving || uploading}
                style={{
                  flex: 1,
                  padding: '10px 16px',
                  fontSize: '0.95rem',
                  fontWeight: 500,
                  fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
                  color: '#4a9eff',
                  backgroundColor: 'transparent',
                  border: '2px solid #4a9eff',
                  borderRadius: '8px',
                  cursor: saving || uploading ? 'not-allowed' : 'pointer',
                  opacity: saving || uploading ? 0.5 : 1,
                  transition: 'all 0.2s ease'
                }}
                onMouseEnter={(e) => {
                  if (!saving && !uploading) {
                    e.currentTarget.style.backgroundColor = 'rgba(74, 158, 255, 0.08)';
                  }
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = 'transparent';
                }}
                onMouseDown={(e) => {
                  if (!saving && !uploading) {
                    e.currentTarget.style.transform = 'scale(0.97)';
                  }
                }}
                onMouseUp={(e) => {
                  e.currentTarget.style.transform = 'scale(1)';
                }}
              >
                {saving ? 'Publishing...' : 'Publish'}
              </button>
            </div>
          </div>
        </Dialog.Content>
      </Dialog.Portal>

      {/* Animations */}
      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes slideUp {
          from {
            opacity: 0;
            transform: translate(-50%, -45%);
          }
          to {
            opacity: 1;
            transform: translate(-50%, -50%);
          }
        }
      `}</style>
    </Dialog.Root>
  );
};

// Helper component for Select items
const SelectItem = React.forwardRef<HTMLDivElement, { value: string; children: React.ReactNode }>(
  ({ value, children }, ref) => {
    return (
      <Select.Item
        value={value}
        ref={ref}
        style={{
          padding: '10px 12px',
          fontSize: '0.95rem',
          borderRadius: '6px',
          cursor: 'pointer',
          outline: 'none',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          userSelect: 'none'
        }}
        onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#f5f5f5'}
        onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
      >
        <Select.ItemText>{children}</Select.ItemText>
        <Select.ItemIndicator>
          <CheckIcon />
        </Select.ItemIndicator>
      </Select.Item>
    );
  }
);

SelectItem.displayName = 'SelectItem';

export default BlogEditor;
