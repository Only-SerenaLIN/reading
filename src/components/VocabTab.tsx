import React, { useState } from "react";
import {
  Bookmark,
  Volume2,
  Trash2,
  Download,
  Search,
  RotateCw,
  Headphones,
} from "lucide-react";
import { VocabItem, GeminiVoiceName } from "../types";
import { playGeminiTTS } from "../utils/geminiTTS";

interface VocabTabProps {
  vocabList: VocabItem[];
  onRemoveItem: (id: string) => void;
  onClearAll: () => void;
  onShowToast: (msg: string) => void;
  geminiVoice: GeminiVoiceName;
  apiKey: string;
}

export const VocabTab: React.FC<VocabTabProps> = ({
  vocabList,
  onRemoveItem,
  onClearAll,
  onShowToast,
  geminiVoice,
  apiKey,
}) => {
  const [filterText, setFilterText] = useState("");
  const [flashcardMode, setFlashcardMode] = useState(false);
  const [flippedCards, setFlippedCards] = useState<Record<string, boolean>>({});

  const filtered = vocabList.filter(
    (item) =>
      item.word.toLowerCase().includes(filterText.toLowerCase()) ||
      item.meaning.toLowerCase().includes(filterText.toLowerCase()) ||
      item.context.toLowerCase().includes(filterText.toLowerCase())
  );

  const toggleFlip = (id: string) => {
    setFlippedCards((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const handleSpeak = (text: string) => {
    if (!text) return;
    playGeminiTTS(text, geminiVoice, apiKey);
  };

  const exportCSV = () => {
    if (vocabList.length === 0) {
      onShowToast("生词本为空，无法导出");
      return;
    }

    const headers = [
      "单词/习语",
      "国际音标",
      "属性标签",
      "小说语境释义与文化梗",
      "原著原句例句",
      "收藏日期",
    ];
    const rows = vocabList.map((item) => [
      item.word,
      item.phonetic,
      item.tag || "",
      item.meaning,
      item.context,
      item.addedAt,
    ]);

    const csvContent =
      "\uFEFF" +
      [headers, ...rows]
        .map((row) =>
          row
            .map((field) => `"${String(field || "").replace(/"/g, '""')}"`)
            .join(",")
        )
        .join("\r\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `英文原著生词本_${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();
    URL.revokeObjectURL(url);
    onShowToast("📥 已导出 CSV 文件（支持 Anki 和 Excel）");
  };

  return (
    <div className="space-y-4">
      {/* Header Card */}
      <div className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200/80 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-3.5">
          <div className="flex items-center gap-2">
            <span className="text-base">⭐</span>
            <div>
              <h2 className="font-bold text-slate-800 text-sm sm:text-base flex items-center gap-2">
                我的收藏生词本
                <span className="text-xs px-2 py-0.5 rounded-full bg-indigo-100 text-indigo-700 font-semibold">
                  {vocabList.length} 词
                </span>
                <span className="inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700">
                  <Headphones className="w-2.5 h-2.5" />
                  Gemini 原声
                </span>
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                记录阅读中遇到的地道词汇与小说梗，随时复习温故
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setFlashcardMode(!flashcardMode)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition cursor-pointer border ${
                flashcardMode
                  ? "bg-indigo-600 text-white border-indigo-600 shadow-xs"
                  : "bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100"
              }`}
            >
              <RotateCw className="w-3.5 h-3.5" />
              <span>{flashcardMode ? "退出翻卡" : "背诵翻卡模式"}</span>
            </button>

            <button
              type="button"
              onClick={exportCSV}
              disabled={vocabList.length === 0}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200/80 hover:bg-emerald-100 transition cursor-pointer disabled:opacity-40"
              title="导出 CSV 文件"
            >
              <Download className="w-3.5 h-3.5" />
              <span>导出 CSV</span>
            </button>
          </div>
        </div>

        {/* Filter Input */}
        {vocabList.length > 0 && (
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={filterText}
              onChange={(e) => setFilterText(e.target.value)}
              placeholder="在生词本中搜索单词、释义或例句..."
              className="w-full pl-9 pr-8 py-2 rounded-xl border border-slate-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 outline-none text-xs bg-slate-50"
            />
            {filterText && (
              <button
                type="button"
                onClick={() => setFilterText("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 text-xs p-1"
              >
                ✕
              </button>
            )}
          </div>
        )}
      </div>

      {/* Vocab Items List */}
      {vocabList.length === 0 ? (
        <div className="bg-white rounded-2xl p-10 border border-slate-200/80 text-center space-y-3">
          <div className="w-12 h-12 mx-auto rounded-full bg-indigo-50 flex items-center justify-center text-indigo-500 text-xl">
            📖
          </div>
          <h3 className="font-bold text-slate-700 text-sm sm:text-base">
            生词本还是空的
          </h3>
          <p className="text-xs text-slate-400 max-w-sm mx-auto leading-relaxed">
            去拍照导读书页，或在“随手查词”中查询生词，点击“☆ 收藏”即可把生僻词加入专属词本！
          </p>
        </div>
      ) : filtered.length === 0 ? (
        <div className="bg-white rounded-2xl p-8 border border-slate-200/80 text-center text-xs text-slate-400">
          未找到匹配 "{filterText}" 的生词。
        </div>
      ) : flashcardMode ? (
        /* Flashcard Quiz View */
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
          {filtered.map((item) => {
            const isFlipped = flippedCards[item.id];
            return (
              <div
                key={item.id}
                onClick={() => toggleFlip(item.id)}
                className={`p-5 rounded-2xl border transition-all cursor-pointer flex flex-col justify-between min-h-[160px] shadow-xs select-none ${
                  isFlipped
                    ? "bg-indigo-50/70 border-indigo-200"
                    : "bg-white border-slate-200/90 hover:border-indigo-300"
                }`}
              >
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                      {isFlipped ? "背面 (释义与例句)" : "正面 (点击翻转看释义)"}
                    </span>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleSpeak(item.word);
                      }}
                      className="p-1.5 rounded-lg bg-white/80 hover:bg-white text-indigo-600 transition shadow-2xs"
                      title="Gemini 原声朗读"
                    >
                      <Volume2 className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  {!isFlipped ? (
                    <div className="py-4 text-center">
                      <div className="flex items-center justify-center gap-2">
                        <h4 className="text-xl sm:text-2xl font-bold text-slate-900">
                          {item.word}
                        </h4>
                        {item.tag && (
                          <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-amber-50 text-amber-700 border border-amber-200">
                            {item.tag}
                          </span>
                        )}
                      </div>
                      {item.phonetic && (
                        <p className="text-xs font-mono text-slate-500 mt-1">
                          [{item.phonetic}]
                        </p>
                      )}
                      <p className="text-xs text-indigo-600 font-medium mt-3">
                        👆 碰触翻卡测验
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-2 py-1">
                      <div className="flex items-baseline gap-2">
                        <span className="font-bold text-base text-indigo-900">
                          {item.word}
                        </span>
                        {item.phonetic && (
                          <span className="text-xs font-mono text-indigo-700">
                            [{item.phonetic}]
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-slate-700 leading-relaxed font-sans">
                        {item.meaning}
                      </p>
                      {item.context && (
                        <p className="text-[11px] italic text-slate-500 bg-white/80 p-2 rounded-lg border-l-2 border-indigo-400 font-serif">
                          “{item.context}”
                        </p>
                      )}
                    </div>
                  )}
                </div>

                <div className="flex items-center justify-between text-[11px] text-slate-400 pt-2 border-t border-slate-100/80 mt-2">
                  <span>{item.addedAt}</span>
                  <span className="text-indigo-600 font-medium">翻转 ⟳</span>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* Regular List View */
        <div className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200/80 shadow-xs divide-y divide-slate-100">
          {filtered.map((item) => (
            <div key={item.id} className="py-3.5 first:pt-0 last:pb-0">
              <div className="flex items-start justify-between gap-2">
                <div className="space-y-0.5">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span
                      onClick={() => handleSpeak(item.word)}
                      className="font-bold text-base text-indigo-700 hover:text-indigo-900 cursor-pointer"
                    >
                      {item.word}
                    </span>
                    {item.phonetic && (
                      <span className="font-mono text-xs text-slate-500 bg-slate-100 px-2 py-0.5 rounded-md">
                        [{item.phonetic}]
                      </span>
                    )}
                    {item.tag && (
                      <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-amber-50 text-amber-700 border border-amber-200">
                        {item.tag}
                      </span>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-1.5 shrink-0">
                  <button
                    type="button"
                    onClick={() => handleSpeak(item.word)}
                    className="p-1.5 rounded-lg bg-indigo-50 text-indigo-700 hover:bg-indigo-100 transition cursor-pointer"
                    title="Gemini 原声朗读"
                  >
                    <Volume2 className="w-4 h-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      onRemoveItem(item.id);
                      onShowToast(`已从生词本移除 "${item.word}"`);
                    }}
                    className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition cursor-pointer"
                    title="移除"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Meaning */}
              <p className="text-xs sm:text-sm text-slate-700 mt-1.5 leading-relaxed">
                {item.meaning}
              </p>

              {/* Context Quote */}
              {item.context && (
                <div
                  onClick={() => handleSpeak(item.context)}
                  className="mt-2 text-xs italic text-slate-500 bg-slate-50 hover:bg-slate-100/80 p-2.5 rounded-xl border-l-3 border-indigo-400 cursor-pointer flex items-start justify-between gap-2 group transition"
                  title="点击试听 Gemini 原声例句"
                >
                  <span className="leading-relaxed font-serif">
                    “{item.context}”
                  </span>
                  <Volume2 className="w-3.5 h-3.5 text-slate-400 group-hover:text-indigo-600 shrink-0 mt-0.5" />
                </div>
              )}

              <div className="flex items-center justify-between mt-2 text-[11px] text-slate-400">
                <span>添加于 {item.addedAt}</span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Clear All Footer Button */}
      {vocabList.length > 0 && !flashcardMode && (
        <div className="text-center pt-2">
          <button
            type="button"
            onClick={() => {
              if (window.confirm("确定要清空生词本中的所有单词吗？")) {
                onClearAll();
                onShowToast("已清空生词本");
              }
            }}
            className="text-xs text-rose-500 hover:text-rose-700 cursor-pointer font-medium py-1 px-3 rounded-lg hover:bg-rose-50 transition"
          >
            清空生词本
          </button>
        </div>
      )}
    </div>
  );
};
