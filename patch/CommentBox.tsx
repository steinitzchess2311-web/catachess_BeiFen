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

      console.log('[export] ===== START EXPORT =====');
      console.log('[export] Scope:', scope);
      console.log('[export] Study ID:', studyId);
      console.log('[export] Chapter ID:', chapterId);
      console.log('[export] Current URL:', window.location.href);

      if (!studyId || (scope === 'chapter' && !chapterId)) {
        console.error('[export] Missing required IDs');
        return;
      }

      const base = '/api/v1/workspace/studies/study-patch';
      const url =
        scope === 'study'
          ? `${base}/study/${studyId}/pgn-export`
          : `${base}/chapter/${chapterId}/pgn-export`;

      console.log('[export] Full request URL:', url);
      console.log('[export] Absolute URL:', new URL(url, window.location.origin).href);

      const response = await fetch(url);

      console.log('[export] Response received:');
      console.log('[export]   - Status:', response.status, response.statusText);
      console.log('[export]   - URL:', response.url);
      console.log('[export]   - Redirected:', response.redirected);

      const contentType = response.headers.get('content-type') || '';
      console.log('[export]   - Content-Type:', contentType);

      // Print all headers
      const headers: Record<string, string> = {};
      response.headers.forEach((value, key) => {
        headers[key] = value;
      });
      console.log('[export]   - All Headers:', headers);

      if (!response.ok) {
        const errorText = await response.text();
        console.error('[export] Error response body (first 500 chars):', errorText.slice(0, 500));
        throw new Error(`Export failed: ${response.status} ${response.statusText}`);
      }

      if (!contentType.includes('application/json')) {
        const fullText = await response.text();
        console.error('[export] Non-JSON response (first 300 chars):', fullText.slice(0, 300));
        console.error('[export] Full response length:', fullText.length);
        throw new Error(
          `Export endpoint returned HTML (likely not deployed or unauthorized). Preview: ${fullText.slice(0, 120)}`
        );
      }

      const data = await response.json();
      console.log('[export] JSON response:', data);

      if (!data?.success) {
        console.error('[export] API returned success=false, error:', data?.error);
        throw new Error(data?.error || 'Export failed');
      }

      const suffix = scope === 'study' ? 'study' : 'chapter';
      const filename = `${studyId}-${suffix}.pgn`;
      console.log('[export] Downloading file:', filename);
      console.log('[export] PGN length:', data.pgn?.length || 0);

      downloadText(filename, data.pgn || '');
      console.log('[export] ===== EXPORT SUCCESS =====');
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Export failed';
      console.error('[export] ===== EXPORT FAILED =====');
      console.error('[export] Error:', error);
      console.error('[export] Error message:', message);
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
