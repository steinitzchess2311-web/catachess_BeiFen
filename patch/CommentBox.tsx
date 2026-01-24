import React, { useEffect, useState } from 'react';
import { useStudy } from './studyContext';

export function CommentBox() {
  const { state, setComment } = useStudy();
  const currentNode = state.tree.nodes[state.cursorNodeId];
  const [value, setValue] = useState(currentNode?.comment || '');

  useEffect(() => {
    setValue(currentNode?.comment || '');
  }, [currentNode?.comment, state.cursorNodeId]);

  return (
    <div className="study-comment-box">
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
    </div>
  );
}

export default CommentBox;
