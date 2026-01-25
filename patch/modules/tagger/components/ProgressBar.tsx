import React from "react";

type ProgressBarProps = {
  value: number;
};

const ProgressBar: React.FC<ProgressBarProps> = ({ value }) => {
  const safeValue = Math.max(0, Math.min(100, value));
  return (
    <div className="tagger-progress">
      <div className="tagger-progress-bar" style={{ width: `${safeValue}%` }} />
    </div>
  );
};

export default ProgressBar;
