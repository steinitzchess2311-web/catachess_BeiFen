import React, { useEffect, useState } from 'react';
import { useStudy } from './studyContext';

export function CommentBox() {
  const { state, setComment } = useStudy();
  const currentNode = state.tree.nodes[state.cursorNodeId];
  const [value, setValue] = useState(currentNode?.comment || '');
  const [activeTab, setActiveTab] = useState<'comment' | 'output'>('comment');
  const [copyState, setCopyState] = useState<'idle' | 'copied' | 'error'>('idle');
  const fen = state.currentFen || '';

  useEffect(() => {
    setValue(currentNode?.comment || '');
  }, [currentNode?.comment, state.cursorNodeId]);

  useEffect(() => {
    if (copyState === 'idle') return;
    const timer = window.setTimeout(() => setCopyState('idle'), 1500);
    return () => window.clearTimeout(timer);
  }, [copyState]);

  const handleCopyFen = async () => {
    if (!fen) return;
    try {
      if (navigator?.clipboard?.writeText) {
        await navigator.clipboard.writeText(fen);
      } else {
        const temp = document.createElement('textarea');
        temp.value = fen;
        temp.setAttribute('readonly', 'true');
        temp.style.position = 'absolute';
        temp.style.left = '-9999px';
        document.body.appendChild(temp);
        temp.select();
        document.execCommand('copy');
        document.body.removeChild(temp);
      }
      setCopyState('copied');
    } catch {
      setCopyState('error');
    }
  };

  const downloadText = (filename: string, text: string) => {
    const blob = new Blob([text], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleExport = async (scope: 'study' | 'chapter') => {
    try {
      const studyId = state.studyId;
      const chapterId = state.chapterId;
      if (!studyId || (scope === 'chapter' && !chapterId)) return;
      const base = '/api/v1/workspace/studies/study-patch';
      const url =
        scope === 'study'
          ? `${base}/study/${studyId}/pgn-export`
          : `${base}/chapter/${chapterId}/pgn-export`;
      console.log('[export] Requesting:', url, { studyId, chapterId, scope });
      const response = await fetch(url);
      const contentType = response.headers.get('content-type') || '';
      console.log('[export] Response status:', response.status, 'Content-Type:', contentType);
      if (!response.ok) {
        throw new Error(`Export failed: ${response.status}`);
      }
      if (!contentType.includes('application/json')) {
        const preview = (await response.text()).slice(0, 120);
        throw new Error(
          `Export endpoint returned HTML (likely not deployed or unauthorized). Preview: ${preview}`
        );
      }
      const data = await response.json();
      if (!data?.success) {
        throw new Error(data?.error || 'Export failed');
      }
      const suffix = scope === 'study' ? 'study' : 'chapter';
      const filename = `${studyId}-${suffix}.pgn`;
      downloadText(filename, data.pgn || '');
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Export failed';
      console.error('[output] export failed', message);
      alert(message);
    }
  };

  return (
    <div className="study-comment-box">
      <div className="study-comment-tabs">
        <button
          type="button"
          className={`study-comment-tab ${activeTab === 'comment' ? 'is-active' : ''}`}
          onClick={() => setActiveTab('comment')}
        >
          Comment
        </button>
        <button
          type="button"
          className={`study-comment-tab ${activeTab === 'output' ? 'is-active' : ''}`}
          onClick={() => setActiveTab('output')}
        >
          Output
        </button>
      </div>
      <div className="study-comment-panel">
        {activeTab === 'comment' ? (
          <textarea
            className="study-comment-input"
            placeholder="Add comment..."
            value={value}
            onChange={(e) => {
              const next = e.target.value;
              setValue(next);
              if (state.cursorNodeId) {
                setComment(state.cursorNodeId, next);
              }
            }}
          />
        ) : (
          <div className="study-info-panel">
            <div className="study-fen-wrap">
              <textarea
                className="study-fen-box"
                readOnly
                value={fen || 'FEN unavailable'}
              />
              <button
                type="button"
                className="study-fen-button is-inline"
                onClick={handleCopyFen}
                disabled={!fen}
              >
                {copyState === 'copied' ? 'Copied' : copyState === 'error' ? 'Copy failed' : 'Copy FEN'}
              </button>
            </div>
            <div className="study-fen-actions">
              <button
                type="button"
                className="study-fen-button"
                onClick={() => handleExport('study')}
                disabled={!state.studyId}
              >
                Export Study PGN
              </button>
              <button
                type="button"
                className="study-fen-button"
                onClick={() => handleExport('chapter')}
                disabled={!state.studyId || !state.chapterId}
              >
                Export Chapter PGN
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default CommentBox;
