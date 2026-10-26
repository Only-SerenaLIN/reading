import React, { useState } from "react";
import {
  Search,
  Volume2,
  Bookmark,
  Sparkles,
  Zap,
  Lightbulb,
  Clock,
  Trash2,
  Headphones,
} from "lucide-react";
import { DictResult, GeminiVoiceName } from "../types";
import { playGeminiTTS } from "../utils/geminiTTS";

interface SearchTabProps {
  onLookup: (word: string, context?: string) => Promise<DictResult | null>;
  isSearching: boolean;
  dictResult: DictResult | null;
  isFavorited: (word: string) => boolean;
  onToggleFavorite: (item: {
    word: string;
    phonetic?: string;
    meaning: string;
    context?: string;
    tag?: string;
  }) => void;
  onShowToast: (msg: string) => void;
  geminiVoice: GeminiVoiceName;
  apiKey: string;
}

export const SearchTab: React.FC<SearchTabProps> = ({
  onLookup,
  isSearching,
  dictResult,
  isFavorited,
  onToggleFavorite,
  onShowToast,
  geminiVoice,
  apiKey,
}) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [contextSentence, setContextSentence] = useState("");
  const [showContextField, setShowContextField] = useState(false);
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);
  const [recentSearches, setRecentSearches] = useState<string[]>(() => {
    try {
      return JSON.parse(localStorage.getItem("recent_novel_searches") || "[]");
    } catch {
      return [];
    }
  });

  const popularChips = [
    "Womp womp",
    "Dick move",
    "hooked her up",
    "trivia",
    "reluctantly",
    "flirted",
    "habenula",
    "phony",
  ];

  const handleSpeak = (text: string) => {
    if (!text) return;
    playGeminiTTS(text, geminiVoice, apiKey, setIsPlayingAudio);
  };

  const handleSearch = async (termToSearch?: string) => {
    const word = (termToSearch || searchTerm).trim();
    if (!word) {
      onShowToast("请输入要查询的单词或词组");
      return;
    }

    const updated = [
      word,
      ...recentSearches.filter((w) => w.toLowerCase() !== word.toLowerCase()),
    ].slice(0, 8);
    setRecentSearches(updated);
    try {
      localStorage.setItem("recent_novel_searches", JSON.stringify(updated));
    } catch {}

    handleSpeak(word);
    await onLookup(word, contextSentence.trim() || undefined);
  };

  const handleQuickChip = (word: string) => {
    setSearchTerm(word);
    handleSearch(word);
  };

  const clearRecent = () => {
    setRecentSearches([]);
    localStorage.removeItem("recent_novel_searches");
    onShowToast("已清空查询历史");
  };

  return (
    <div className="space-y-4">
      {/* Search Input Box Card */}
      <div className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200/80 shadow-xs space-y-3.5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-base">🔍</span>
            <h2 className="font-bold text-slate-800 text-sm sm:text-base">
              随手查生词 / 查俚语 / 查人名背景
            </h2>
          </div>
          <span className="inline-flex items-center gap-1 text-[11px] font-semibold px-2.5 py-0.5 rounded-full bg-indigo-50 text-indigo-700">
            <Headphones className="w-3 h-3 text-indigo-500" />
            Gemini 原声
          </span>
        </div>

        {/* Input Bar */}
        <div className="flex items-center gap-2">
          <div className="relative flex-1">
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") handleSearch();
              }}
              placeholder="输入生词、习语或俚语 (如 Womp womp, Dick move)..."
              className="w-full pl-4 pr-10 py-3 rounded-xl border border-slate-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 outline-none text-sm bg-white"
            />
            {searchTerm && (
              <button
                type="button"
                onClick={() => setSearchTerm("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 text-xs p-1"
              >
                ✕
              </button>
            )}
          </div>

          <button
            type="button"
            onClick={() => handleSpeak(searchTerm)}
            disabled={!searchTerm}
            className={`p-3 rounded-xl transition cursor-pointer ${
              isPlayingAudio
                ? "bg-indigo-600 text-white"
                : "bg-slate-100 hover:bg-slate-200 text-slate-700 disabled:opacity-40"
            }`}
            title="试听 Gemini 官方原声"
          >
            <Volume2 className="w-5 h-5" />
          </button>
        </div>

        {/* Optional Context Sentence Toggle */}
        <div>
          {!showContextField ? (
            <button
              type="button"
              onClick={() => setShowContextField(true)}
              className="text-xs text-indigo-600 hover:text-indigo-800 font-medium cursor-pointer"
            >
              + 添加书中原句 (获得更接地气的情节笑点解析)
            </button>
          ) : (
            <div className="space-y-1.5 pt-1">
              <div className="flex items-center justify-between">
                <label className="text-xs font-medium text-slate-500">
                  原著上下文句子 (选填):
                </label>
                <button
                  type="button"
                  onClick={() => {
                    setShowContextField(false);
                    setContextSentence("");
                  }}
                  className="text-[11px] text-slate-400 hover:text-slate-600"
                >
                  取消
                </button>
              </div>
              <input
                type="text"
                value={contextSentence}
                onChange={(e) => setContextSentence(e.target.value)}
                placeholder="例如: A mutual friend had hooked her up with Pierre..."
                className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 outline-none text-xs bg-slate-50"
              />
            </div>
          )}
        </div>

        {/* Query Button */}
        <button
          type="button"
          onClick={() => handleSearch()}
          disabled={isSearching || !searchTerm.trim()}
          className="w-full py-3 px-4 rounded-xl font-semibold text-white bg-indigo-600 hover:bg-indigo-700 active:scale-98 transition shadow-xs flex items-center justify-center gap-2 text-sm disabled:opacity-50 cursor-pointer"
        >
          {isSearching ? (
            <>
              <Zap className="w-4 h-4 animate-spin" />
              <span>AI 语境极速解析中 (1~2秒)...</span>
            </>
          ) : (
            <>
              <Sparkles className="w-4 h-4" />
              <span>✨ 极速 AI 语境释义 & 原声解析</span>
            </>
          )}
        </button>

        {/* Quick Search Chips */}
        <div className="pt-2 border-t border-slate-100">
          <span className="text-xs text-slate-400 block mb-1.5">
            💡 原著高频特色口语推荐：
          </span>
          <div className="flex flex-wrap gap-1.5">
            {popularChips.map((chip) => (
              <button
                key={chip}
                type="button"
                onClick={() => handleQuickChip(chip)}
                className="text-xs px-2.5 py-1 rounded-full bg-slate-100 hover:bg-indigo-50 hover:text-indigo-600 text-slate-600 transition cursor-pointer font-medium"
              >
                {chip}
              </button>
            ))}
          </div>
        </div>

        {/* Recent Search History */}
        {recentSearches.length > 0 && (
          <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs text-slate-400">
            <div className="flex items-center gap-1.5 overflow-x-auto py-1">
              <Clock className="w-3.5 h-3.5 shrink-0" />
              <span>历史:</span>
              {recentSearches.map((item) => (
                <button
                  key={item}
                  type="button"
                  onClick={() => handleQuickChip(item)}
                  className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-600 hover:bg-slate-200 cursor-pointer shrink-0"
                >
                  {item}
                </button>
              ))}
            </div>
            <button
              type="button"
              onClick={clearRecent}
              className="text-slate-400 hover:text-slate-600 p-1 shrink-0 ml-2"
              title="清空历史"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          </div>
        )}
      </div>

      {/* Dict Result Card */}
      {dictResult && (
        <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs space-y-3 animate-in fade-in duration-200">
          <div className="flex items-start justify-between gap-3">
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h3
                  onClick={() => handleSpeak(dictResult.word)}
                  className="text-xl sm:text-2xl font-bold text-indigo-700 hover:text-indigo-900 cursor-pointer tracking-tight"
                >
                  {dictResult.word}
                </h3>
                {dictResult.phonetic && (
                  <span className="font-mono text-xs text-slate-500 bg-slate-100 px-2.5 py-1 rounded-lg">
                    [{dictResult.phonetic}]
                  </span>
                )}
                {dictResult.tag && (
                  <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-amber-50 text-amber-700 border border-amber-200">
                    {dictResult.tag}
                  </span>
                )}
              </div>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <button
                type="button"
                onClick={() => handleSpeak(dictResult.word)}
                className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-indigo-50 text-indigo-700 hover:bg-indigo-100 transition cursor-pointer text-xs font-semibold"
                title="Gemini 官方原声"
              >
                <Volume2 className="w-4 h-4" />
                <span>原声</span>
              </button>

              <button
                type="button"
                onClick={() =>
                  onToggleFavorite({
                    word: dictResult.word,
                    phonetic: dictResult.phonetic,
                    meaning: dictResult.meaning,
                    context: dictResult.context,
                    tag: dictResult.tag,
                  })
                }
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition cursor-pointer ${
                  isFavorited(dictResult.word)
                    ? "bg-amber-100 text-amber-800 border border-amber-300"
                    : "bg-slate-100 text-slate-700 hover:bg-slate-200"
                }`}
              >
                <Bookmark
                  className={`w-4 h-4 ${
                    isFavorited(dictResult.word)
                      ? "fill-amber-600 text-amber-600"
                      : "text-slate-500"
                  }`}
                />
                <span>
                  {isFavorited(dictResult.word) ? "已加入生词本" : "加入生词本"}
                </span>
              </button>
            </div>
          </div>

          {/* Meaning */}
          <div className="text-sm text-slate-800 leading-relaxed bg-slate-50/80 p-3.5 rounded-xl border border-slate-100 font-sans">
            {dictResult.meaning}
          </div>

          {/* Context Quote */}
          {dictResult.context && (
            <div
              onClick={() => handleSpeak(dictResult.context)}
              className="text-xs italic text-slate-600 bg-indigo-50/50 hover:bg-indigo-50 p-3 rounded-xl border-l-3 border-indigo-500 cursor-pointer flex items-start justify-between gap-2 group transition"
              title="点击试听 Gemini 原声读音"
            >
              <div className="space-y-0.5">
                <span className="text-[11px] font-bold text-indigo-700 not-italic uppercase tracking-wider block">
                  原著例句 / 原文搭配 🔊
                </span>
                <span className="leading-relaxed font-serif">
                  “{dictResult.context}”
                </span>
              </div>
              <Volume2 className="w-3.5 h-3.5 text-indigo-400 group-hover:text-indigo-600 shrink-0 mt-1" />
            </div>
          )}

          {/* Tip / Memory Hook */}
          {dictResult.tip && (
            <div className="flex items-start gap-2 text-xs text-amber-800 bg-amber-50/80 p-3 rounded-xl border border-amber-200/60">
              <Lightbulb className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
              <div className="leading-relaxed">
                <strong>速记秘籍与渊源：</strong> {dictResult.tip}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
