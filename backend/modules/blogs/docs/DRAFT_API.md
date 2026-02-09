# Blog Draft Management API

## Overview

The blog system supports draft management, allowing editors to save work-in-progress articles before publishing.

## Draft Status Flow

Articles have a `status` field with three possible values:

```
draft → published → archived
```

- **draft**: Work in progress, only visible to the author
- **published**: Public article, visible to all users
- **archived**: Hidden from public but preserved in database

## API Endpoints

### 1. Get My Drafts

Retrieve all draft articles created by the current user.

**Endpoint:** `GET /api/blogs/articles/my-drafts`

**Authentication:** Required (Editor or Admin role)

**Response:**
```json
[
  {
    "id": "uuid",
    "title": "Draft Article Title",
    "subtitle": "Optional subtitle",
    "cover_image_url": "https://cdn.example.com/image.jpg",
    "author_name": "John Doe",
    "author_type": "human",
    "category": "function",
    "tags": ["tag1", "tag2"],
    "is_pinned": false,
    "view_count": 0,
    "like_count": 0,
    "comment_count": 0,
    "created_at": "2026-02-09T12:00:00Z",
    "published_at": null
  }
]
```

**Example:**
```bash
curl -X GET "https://your-domain.com/api/blogs/articles/my-drafts" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

### 2. Create Draft Article

Create a new article with `status: "draft"`.

**Endpoint:** `POST /api/blogs/articles`

**Authentication:** Required (Editor or Admin role)

**Request Body:**
```json
{
  "title": "My Draft Article",
  "subtitle": "Optional subtitle",
  "content": "# Markdown content here\n\nThis is a draft.",
  "cover_image_url": "https://cdn.example.com/cover.jpg",
  "author_name": "John Doe",
  "author_type": "human",
  "category": "function",
  "sub_category": "tutorial",
  "tags": ["draft", "work-in-progress"],
  "status": "draft",
  "is_pinned": false,
  "pin_order": 0
}
```

**Response:** Full article object (ArticleResponse)

### 3. Update Draft Article

Update an existing draft. Users can only edit their own articles (unless admin).

**Endpoint:** `PUT /api/blogs/articles/{article_id}`

**Authentication:** Required (Editor or Admin role)

**Permission:**
- ✅ Users can edit **their own** articles
- ✅ Admins can edit **any** article
- ❌ Users cannot edit articles created by others

**Request Body (partial update):**
```json
{
  "title": "Updated Title",
  "content": "Updated content",
  "status": "draft"
}
```

**Publish a Draft:**
```json
{
  "status": "published"
}
```

When status changes from `draft` → `published`, the `published_at` timestamp is automatically set.

### 4. Delete Draft Article

Delete an article. Users can only delete their own articles (unless admin).

**Endpoint:** `DELETE /api/blogs/articles/{article_id}`

**Authentication:** Required (Editor or Admin role)

**Permission:**
- ✅ Users can delete **their own** articles
- ✅ Admins can delete **any** article
- ❌ Users cannot delete articles created by others

**Response:**
```json
{
  "success": true,
  "message": "Article deleted successfully"
}
```

## Permission Matrix

| Action | Own Article | Other's Article | Admin Override |
|--------|-------------|-----------------|----------------|
| Create | ✅ | N/A | N/A |
| View Draft | ✅ | ❌ | ✅ |
| Edit Draft | ✅ | ❌ | ✅ |
| Delete Draft | ✅ | ❌ | ✅ |
| Publish Draft | ✅ | ❌ | ✅ |
| Pin Article | ❌ | ❌ | ✅ (admin only) |

## Frontend Integration Guide

### 1. Create New Draft

```typescript
async function createDraft(draftData: ArticleCreate) {
  const response = await fetch('/api/blogs/articles', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      ...draftData,
      status: 'draft'  // Important: set status to 'draft'
    })
  });
  return response.json();
}
```

### 2. Load User's Drafts

```typescript
async function loadMyDrafts() {
  const response = await fetch('/api/blogs/articles/my-drafts', {
    headers: {
      'Authorization': `Bearer ${token}`
    }
  });
  return response.json();
}
```

### 3. Auto-Save Draft (with localStorage backup)

```typescript
// Save to localStorage every 30 seconds
setInterval(() => {
  const draftContent = {
    title: titleInput.value,
    content: contentInput.value,
    // ... other fields
  };
  localStorage.setItem('blog-draft-backup', JSON.stringify(draftContent));
}, 30000);

// Save to server when user clicks "Save Draft"
async function saveDraft(articleId: string, updates: ArticleUpdate) {
  const response = await fetch(`/api/blogs/articles/${articleId}`, {
    method: 'PUT',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      ...updates,
      status: 'draft'  // Keep as draft
    })
  });
  return response.json();
}
```

### 4. Publish Draft

```typescript
async function publishDraft(articleId: string) {
  const response = await fetch(`/api/blogs/articles/${articleId}`, {
    method: 'PUT',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      status: 'published'  // Change status to publish
    })
  });
  return response.json();
}
```

### 5. Restore from localStorage (Recovery)

```typescript
function restoreFromLocalStorage() {
  const backup = localStorage.getItem('blog-draft-backup');
  if (backup) {
    const draft = JSON.parse(backup);
    // Restore form fields
    titleInput.value = draft.title;
    contentInput.value = draft.content;
    // ... restore other fields
  }
}
```

## Error Handling

### 403 Forbidden - Cannot Edit Other's Article

```json
{
  "detail": "You can only edit your own articles"
}
```

**Solution:** User is trying to edit an article they don't own. Check `author_id` matches `current_user.id`.

### 403 Forbidden - Cannot Delete Other's Article

```json
{
  "detail": "You can only delete your own articles"
}
```

**Solution:** User is trying to delete an article they don't own. Check `author_id` matches `current_user.id`.

### 404 Not Found

```json
{
  "detail": "Article not found"
}
```

**Solution:** Article ID is invalid or article was deleted.

## Best Practices

### 1. Hybrid Storage Strategy

Combine server-side storage with client-side backup:

```typescript
// 1. Auto-save to localStorage every 30s (local backup)
// 2. Explicit save to server when user clicks "Save Draft"
// 3. On page load, check if localStorage has newer content than server
```

### 2. Conflict Resolution

```typescript
async function loadDraft(articleId: string) {
  // Load from server
  const serverDraft = await fetch(`/api/blogs/articles/${articleId}`);
  const serverData = await serverDraft.json();

  // Check localStorage
  const localBackup = localStorage.getItem(`draft-${articleId}`);

  if (localBackup) {
    const localData = JSON.parse(localBackup);

    // Compare timestamps
    if (new Date(localData.updated_at) > new Date(serverData.updated_at)) {
      // Local version is newer - prompt user
      if (confirm('Local backup is newer. Restore from backup?')) {
        return localData;
      }
    }
  }

  return serverData;
}
```

### 3. Clear localStorage After Publishing

```typescript
async function publishDraft(articleId: string) {
  const response = await publishDraftToServer(articleId);

  if (response.ok) {
    // Clear localStorage backup after successful publish
    localStorage.removeItem(`draft-${articleId}`);
    localStorage.removeItem('blog-draft-backup');
  }

  return response;
}
```

## Examples

### Complete Draft Workflow

```bash
# 1. Create draft
curl -X POST "https://api.example.com/api/blogs/articles" \
  -H "Authorization: Bearer TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "My Draft",
    "content": "Draft content",
    "status": "draft",
    "category": "function",
    "author_name": "John",
    "author_type": "human"
  }'

# Response: { "id": "draft-uuid", ... }

# 2. Get my drafts
curl -X GET "https://api.example.com/api/blogs/articles/my-drafts" \
  -H "Authorization: Bearer TOKEN"

# 3. Update draft
curl -X PUT "https://api.example.com/api/blogs/articles/draft-uuid" \
  -H "Authorization: Bearer TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Updated Draft Title",
    "content": "Updated content"
  }'

# 4. Publish draft
curl -X PUT "https://api.example.com/api/blogs/articles/draft-uuid" \
  -H "Authorization: Bearer TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"status": "published"}'

# 5. (Optional) Delete draft
curl -X DELETE "https://api.example.com/api/blogs/articles/draft-uuid" \
  -H "Authorization: Bearer TOKEN"
```

## Security Notes

1. **Author Verification**: The system automatically checks `author_id` matches the authenticated user's ID
2. **Admin Override**: Admins can edit/delete any article regardless of ownership
3. **Draft Privacy**: Draft articles (`status='draft'`) are never returned by public endpoints
4. **Token Security**: Always use HTTPS and secure JWT token storage

## Cache Behavior

- **My Drafts**: Not cached (always fresh from database)
- **Published Articles**: Cached with 5-10 minute TTL
- **Cache Invalidation**: Automatic on create/update/delete operations
