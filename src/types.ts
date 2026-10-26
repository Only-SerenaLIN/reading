export interface CharacterItem {
  name: string;
  phonetic: string;
  desc: string;
}

export interface HighlightedWord {
  word: string;
  phonetic: string;
  meaning: string;
  context: string;
}

export interface PageGuideResult {
  summary: string;
  characters: CharacterItem[];
  highlighted_words: HighlightedWord[];
  analyzedAt?: string;
  durationMs?: number;
}

export interface VocabItem {
  id: string;
  word: string;
  phonetic: string;
  meaning: string;
  context: string;
  addedAt: string;
  reviewedTimes?: number;
}

export interface DictResult {
  word: string;
  phonetic: string;
  meaning: string;
  context: string;
  tip?: string;
}
