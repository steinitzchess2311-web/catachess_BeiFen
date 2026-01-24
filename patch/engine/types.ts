export type EngineScore = number | string;

export interface EngineLine {
  multipv: number;
  score: EngineScore;
  pv: string[];
}

export type EngineSource = 'lichess-cloud' | 'sf-catachess';

export interface EngineAnalysis {
  source: EngineSource;
  lines: EngineLine[];
}
