import React from "react";
import { TagStatItem } from "../api/taggerApi";

type StatsTableProps = {
  stats: TagStatItem[];
};

const StatsTable: React.FC<StatsTableProps> = ({ stats }) => {
  if (!stats.length) {
    return <div className="tagger-empty">No stats yet. Upload a PGN.</div>;
  }

  return (
    <div className="tagger-table">
      <div className="tagger-row tagger-row-head">
        <span>Tag</span>
        <span>Count</span>
        <span>Percent</span>
      </div>
      {stats.map((item) => (
        <div className="tagger-row" key={item.tag_name}>
          <span>{item.tag_name}</span>
          <span>{item.tag_count}</span>
          <span>{item.percentage.toFixed(2)}%</span>
        </div>
      ))}
    </div>
  );
};

export default StatsTable;
