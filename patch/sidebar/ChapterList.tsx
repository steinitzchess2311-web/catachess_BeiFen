import React from 'react';

export interface ChapterListProps {
  chapters: Array<{ id: string; title?: string; order?: number }>;
  currentChapterId: string | null;
  onSelectChapter: (chapterId: string) => void;
  onCreateChapter: () => void;
}

export function ChapterList({
  chapters,
  currentChapterId,
  onSelectChapter,
  onCreateChapter,
}: ChapterListProps) {
  return (
    <section className="patch-chapter-list">
      <header className="patch-chapter-list__header">
        <div>
          <h3>Chapters</h3>
          <p>{chapters.length} total</p>
        </div>
        <button
          type="button"
          className="patch-chapter-list__new"
          onClick={onCreateChapter}
        >
          New Chapter
        </button>
      </header>
      <div className="patch-chapter-list__scroll">
        {chapters.length === 0 && (
          <div className="patch-chapter-list__empty">No chapters yet.</div>
        )}
        {chapters.map((chapter, index) => {
          const isActive = chapter.id === currentChapterId;
          const label = chapter.title || `Chapter ${index + 1}`;
          const order = typeof chapter.order === 'number' ? chapter.order + 1 : index + 1;
          return (
            <button
              key={chapter.id}
              type="button"
              className={`patch-chapter-list__item${isActive ? ' is-active' : ''}`}
              onClick={() => onSelectChapter(chapter.id)}
            >
              <span className="patch-chapter-list__order">{order}</span>
              <span className="patch-chapter-list__title">{label}</span>
            </button>
          );
        })}
      </div>
    </section>
  );
}

