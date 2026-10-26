export interface TermItem {
  term: string;
  phonetic?: string;
  tag?: string; // e.g. "高频俚语" | "实用口语短语" | "拟声流行语" | "理科幽默" | "经典双关"
  explanation: string;
  context?: string;
}

export interface SectionBreakdown {
  section_title: string;
  section_story?: string;
  terms: TermItem[];
}

export interface PageGuideResult {
  cheer_intro: string;
  sections: SectionBreakdown[];
  reading_summary: string;
  durationMs?: number;
  analyzedAt?: string;
}

export interface VocabItem {
  id: string;
  word: string;
  phonetic: string;
  tag?: string;
  meaning: string;
  context: string;
  addedAt: string;
  reviewedTimes?: number;
}

export interface DictResult {
  word: string;
  phonetic: string;
  tag?: string;
  meaning: string;
  context: string;
  tip?: string;
}

export type GeminiVoiceName = "Zephyr" | "Puck" | "Kore" | "Charon" | "Fenrir";
