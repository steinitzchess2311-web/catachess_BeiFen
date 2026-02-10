# ArticleCard Component

Blog article preview card component with image, content, metadata, and action buttons.

## 📁 Folder Structure

```
ArticleCard/
├── ArticleCard.tsx          # Main integration component
├── ArticleImage.tsx          # Cover image with badges
├── ArticleContent.tsx        # Title and subtitle
├── ArticleMeta.tsx           # Author, date, view count
├── ActionButtons.tsx         # Delete and pin buttons
├── DeleteConfirmDialog.tsx   # Inline delete confirmation
├── types.ts                  # TypeScript type definitions
├── index.ts                  # Module exports
└── ArticleCard.md            # This documentation
```

## 🎯 Component Responsibilities

### ArticleCard.tsx (Main)
- **Purpose**: Orchestrates all sub-components and manages state
- **State**: Delete/pin loading states, dialog visibility
- **Logic**: Permission checks, event handlers, API calls
- **Integration**: Assembles all sub-components into complete card

### ArticleImage.tsx
- **Purpose**: Display cover image with overlay badges
- **Features**:
  - Fallback to default logo if no image
  - Category badge (top-left)
  - Pinned badge (top-right, conditional)
  - Hover zoom effect on image

### ArticleContent.tsx
- **Purpose**: Display article title and subtitle
- **Features**:
  - Title: 2-line clamp with ellipsis
  - Subtitle: 3-line clamp with ellipsis
  - Responsive text sizing

### ArticleMeta.tsx
- **Purpose**: Display article metadata
- **Shows**:
  - Author name (bold)
  - Published date (formatted: "Jan 15, 2024")
  - View count (if > 0)
  - Separator bullets (•)

### ActionButtons.tsx
- **Purpose**: Render delete and pin action buttons
- **Features**:
  - Delete button (red, shows for author/editor in drafts view, admin in all views)
  - Pin button (yellow/gray, admin only)
  - Loading states with disabled styling
  - Hover and active animations

### DeleteConfirmDialog.tsx
- **Purpose**: Inline confirmation dialog for delete action
- **Behavior**:
  - Appears above delete button (no fullscreen overlay)
  - Click outside to dismiss
  - Slide-up animation
  - Two buttons: No (blue), Yes (red)

### types.ts
- **Purpose**: Centralized TypeScript definitions
- **Exports**:
  - All component prop interfaces
  - ViewMode type
  - CATEGORY_LABELS constant

## 🔌 Usage

```tsx
import ArticleCard from './ArticleCard';

<ArticleCard
  article={article}
  userRole="editor"
  viewMode="drafts"
  onDelete={(id) => handleDelete(id)}
  onPinToggle={(id) => handlePinToggle(id)}
/>
```

## 🎨 Design Patterns

### Component Composition
Each sub-component is focused on a single responsibility (SRP), making the code:
- **Testable**: Each component can be unit tested independently
- **Reusable**: Components can be used in other contexts
- **Maintainable**: Changes to one part don't affect others

### Props Drilling
Props are passed down through the component tree:
```
ArticleCard (state + handlers)
  ├─> ArticleImage (data props)
  ├─> ArticleContent (data props)
  ├─> ArticleMeta (data props)
  ├─> ActionButtons (state + handlers)
  └─> DeleteConfirmDialog (state + handlers)
```

### Separation of Concerns
- **Data**: Article data flows from parent through props
- **State**: Local state managed in main ArticleCard
- **Logic**: Event handlers and API calls in main component
- **UI**: Visual rendering split into focused sub-components

## 🔐 Permissions

### Delete Button
- **Admin**: Can delete any article in any view
- **Editor**: Can delete own articles in 'drafts' and 'my-published' views
- **User**: Cannot delete

### Pin Button
- **Admin**: Can pin/unpin any article
- **Editor/User**: Cannot pin

## 🎭 Interactions

### Card Hover
- Lifts up 4px
- Shadow intensifies
- Image scales to 105%

### Delete Flow
1. Click delete button
2. Dialog appears above button
3. Click "Yes" → API call → success callback
4. Click "No" or outside → dialog closes

### Pin Flow
1. Click pin button
2. Immediate API call (no confirmation)
3. Success → callback updates UI
4. Button text changes: "Pin" ↔ "Unpin"

## 📦 Dependencies

- `react`: Core React hooks and types
- `react-router-dom`: Link component for navigation
- `blogApi`: API client for delete/pin operations
- `BlogArticle`: Type definition from global types

## 🚀 Future Improvements

- [ ] Extract styles to CSS modules
- [ ] Add error boundary for API failures
- [ ] Add loading skeleton for image
- [ ] Implement optimistic UI updates
- [ ] Add keyboard navigation support
- [ ] Extract dialog animation to shared styles
