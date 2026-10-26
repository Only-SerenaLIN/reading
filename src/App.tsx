import React, { useState, useEffect } from "react";
import { BookOpen, Search, Bookmark } from "lucide-react";
import { Header } from "./components/Header";
import { GuideTab } from "./components/GuideTab";
import { SearchTab } from "./components/SearchTab";
import { VocabTab } from "./components/VocabTab";
import { SettingsModal } from "./components/SettingsModal";
import { PageGuideResult, DictResult, VocabItem, GeminiVoiceName } from "./types";

export default function App() {
  const [activeTab, setActiveTab] = useState<"guide" | "search" | "vocab">("guide");
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  // Settings & Status State
  const [apiKey, setApiKey] = useState(() => localStorage.getItem("gemini_api_key") || "");
  const [geminiVoice, setGeminiVoice] = useState<GeminiVoiceName>(() => {
    const saved = localStorage.getItem("novel_gemini_voice") as GeminiVoiceName;
    return saved || "Zephyr";
  });
  const [maxDimension, setMaxDimension] = useState(() => {
    const saved = localStorage.getItem("novel_compress_dim");
    return saved ? Number(saved) : 840;
  });
  const [serverStatus, setServerStatus] = useState({
    hasServerKey: true,
    speedOptimized: true,
  });

  // Guide Page State
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [guideResult, setGuideResult] = useState<PageGuideResult | null>(null);
  const [loadedImages, setLoadedImages] = useState<
    { id: string; dataUrl: string; base64: string; mimeType: string; sizeKb: number }[]
  >([]);

  // Search State
  const [isSearching, setIsSearching] = useState(false);
  const [dictResult, setDictResult] = useState<DictResult | null>(null);

  // Vocab Book State
  const [vocabList, setVocabList] = useState<VocabItem[]>(() => {
    try {
      return JSON.parse(localStorage.getItem("my_novel_vocab_book") || "[]");
    } catch {
      return [];
    }
  });

  // Toast State
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
  };

  useEffect(() => {
    if (!toastMessage) return;
    const timer = setTimeout(() => {
      setToastMessage(null);
    }, 2800);
    return () => clearTimeout(timer);
  }, [toastMessage]);

  // Check server status on mount
  useEffect(() => {
    fetch("/api/status")
      .then((res) => res.json())
      .then((data) => {
        setServerStatus({
          hasServerKey: Boolean(data.hasServerKey),
          speedOptimized: Boolean(data.speedOptimized),
        });
      })
      .catch((err) => {
        console.warn("Server status check skipped:", err);
      });
  }, []);

  // Save Vocab book whenever it changes
  useEffect(() => {
    try {
      localStorage.setItem("my_novel_vocab_book", JSON.stringify(vocabList));
    } catch (e) {
      console.error("Failed to save vocab book:", e);
    }
  }, [vocabList]);

  const handleSaveApiKey = (key: string) => {
    setApiKey(key);
    if (key) {
      localStorage.setItem("gemini_api_key", key);
      showToast("已保存自定义 Gemini Key");
    } else {
      localStorage.removeItem("gemini_api_key");
      showToast("已切换回服务端内置 Key");
    }
  };

  const handleChangeGeminiVoice = (voice: GeminiVoiceName) => {
    setGeminiVoice(voice);
    localStorage.setItem("novel_gemini_voice", voice);
    showToast(`已切换为 Gemini ${voice} 原声音色`);
  };

  const handleChangeMaxDimension = (dim: number) => {
    setMaxDimension(dim);
    localStorage.setItem("novel_compress_dim", String(dim));
  };

  const isFavorited = (word: string) => {
    return vocabList.some(
      (item) => item.word.trim().toLowerCase() === word.trim().toLowerCase()
    );
  };

  const handleToggleFavorite = (item: {
    word: string;
    phonetic?: string;
    meaning: string;
    context?: string;
    tag?: string;
  }) => {
    const existingIndex = vocabList.findIndex(
      (v) => v.word.trim().toLowerCase() === item.word.trim().toLowerCase()
    );

    if (existingIndex > -1) {
      setVocabList((prev) => prev.filter((_, idx) => idx !== existingIndex));
      showToast(`已从生词本移除 "${item.word}"`);
    } else {
      const newItem: VocabItem = {
        id: `${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
        word: item.word,
        phonetic: item.phonetic || "",
        tag: item.tag || "",
        meaning: item.meaning || "",
        context: item.context || "",
        addedAt: new Date().toLocaleDateString("zh-CN"),
      };
      setVocabList((prev) => [newItem, ...prev]);
      showToast(`⭐ 已将 "${item.word}" 存入生词本！`);
    }
  };

  const handleRemoveVocabItem = (id: string) => {
    setVocabList((prev) => prev.filter((item) => item.id !== id));
  };

  const handleClearVocab = () => {
    setVocabList([]);
  };

  // Analyze 1 or multiple pages with section breakdown & rapid speed
  const handleAnalyzePages = async (
    images: { base64: string; mimeType: string }[]
  ) => {
    if (!images || images.length === 0) return;
    setIsAnalyzing(true);
    const startTime = Date.now();

    try {
      const headers: Record<string, string> = {
        "Content-Type": "application/json",
      };
      if (apiKey && apiKey.trim()) {
        headers["x-gemini-api-key"] = apiKey.trim();
      }

      const res = await fetch("/api/analyze-page", {
        method: "POST",
        headers,
        body: JSON.stringify({
          images,
        }),
      });

      const json = await res.json();
      if (!res.ok || json.error) {
        throw new Error(json.error || `请求失败 (${res.status})`);
      }

      const durationMs = Date.now() - startTime;
      const data: PageGuideResult = {
        ...json.data,
        analyzedAt: new Date().toLocaleTimeString(),
        durationMs,
      };

      setGuideResult(data);
      showToast(`⚡ 导读完成！耗时 ${(durationMs / 1000).toFixed(1)} 秒`);
    } catch (err: any) {
      console.error("Analyze page failed:", err);
      showToast(`❌ 导读解析失败: ${err.message || "请重试"}`);
    } finally {
      setIsAnalyzing(false);
    }
  };

  // Word lookup
  const handleLookupWord = async (
    word: string,
    context?: string
  ): Promise<DictResult | null> => {
    setIsSearching(true);
    try {
      const headers: Record<string, string> = {
        "Content-Type": "application/json",
      };
      if (apiKey && apiKey.trim()) {
        headers["x-gemini-api-key"] = apiKey.trim();
      }

      const res = await fetch("/api/lookup-word", {
        method: "POST",
        headers,
        body: JSON.stringify({
          word,
          contextSentence: context,
        }),
      });

      const json = await res.json();
      if (!res.ok || json.error) {
        throw new Error(json.error || "查询失败");
      }

      setDictResult(json.data);
      return json.data;
    } catch (err: any) {
      showToast(`查询失败: ${err.message || "请稍后重试"}`);
      return null;
    } finally {
      setIsSearching(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 pb-24 select-none font-sans">
      {/* Header */}
      <Header
        onOpenSettings={() => setIsSettingsOpen(true)}
        serverStatus={serverStatus}
        hasCustomKey={Boolean(apiKey)}
      />

      {/* Main Container */}
      <main className="max-w-2xl mx-auto px-4 py-4 sm:px-6">
        {activeTab === "guide" && (
          <GuideTab
            onAnalyze={handleAnalyzePages}
            isAnalyzing={isAnalyzing}
            result={guideResult}
            loadedImages={loadedImages}
            onSetLoadedImages={setLoadedImages}
            isFavorited={isFavorited}
            onToggleFavorite={handleToggleFavorite}
            onShowToast={showToast}
            geminiVoice={geminiVoice}
            apiKey={apiKey}
            maxDimension={maxDimension}
          />
        )}

        {activeTab === "search" && (
          <SearchTab
            onLookup={handleLookupWord}
            isSearching={isSearching}
            dictResult={dictResult}
            isFavorited={isFavorited}
            onToggleFavorite={handleToggleFavorite}
            onShowToast={showToast}
            geminiVoice={geminiVoice}
            apiKey={apiKey}
          />
        )}

        {activeTab === "vocab" && (
          <VocabTab
            vocabList={vocabList}
            onRemoveItem={handleRemoveVocabItem}
            onClearAll={handleClearVocab}
            onShowToast={showToast}
            geminiVoice={geminiVoice}
            apiKey={apiKey}
          />
        )}
      </main>

      {/* Settings Modal */}
      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        apiKey={apiKey}
        onSaveApiKey={handleSaveApiKey}
        serverHasKey={serverStatus.hasServerKey}
        geminiVoice={geminiVoice}
        onChangeGeminiVoice={handleChangeGeminiVoice}
        maxDimension={maxDimension}
        onChangeMaxDimension={handleChangeMaxDimension}
      />

      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-20 left-1/2 -translate-x-1/2 z-50 bg-slate-900/90 backdrop-blur-md text-white text-xs sm:text-sm font-medium px-4 py-2.5 rounded-full shadow-lg border border-slate-700/50 flex items-center gap-2 pointer-events-none animate-in fade-in slide-in-from-bottom-2 duration-150">
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Fixed Bottom Navigation Bar */}
      <nav className="fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-lg border-t border-slate-200/80 px-2 py-2 safe-bottom">
        <div className="max-w-md mx-auto grid grid-cols-3 gap-1">
          <button
            type="button"
            onClick={() => setActiveTab("guide")}
            className={`flex flex-col items-center justify-center py-1.5 px-2 rounded-xl transition cursor-pointer ${
              activeTab === "guide"
                ? "text-indigo-600 font-bold bg-indigo-50/70"
                : "text-slate-500 hover:text-slate-800"
            }`}
          >
            <BookOpen className="w-5 h-5 mb-0.5" />
            <span className="text-[11px]">拍照导读</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("search")}
            className={`flex flex-col items-center justify-center py-1.5 px-2 rounded-xl transition cursor-pointer ${
              activeTab === "search"
                ? "text-indigo-600 font-bold bg-indigo-50/70"
                : "text-slate-500 hover:text-slate-800"
            }`}
          >
            <Search className="w-5 h-5 mb-0.5" />
            <span className="text-[11px]">随手查词</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("vocab")}
            className={`flex flex-col items-center justify-center py-1.5 px-2 rounded-xl transition cursor-pointer relative ${
              activeTab === "vocab"
                ? "text-indigo-600 font-bold bg-indigo-50/70"
                : "text-slate-500 hover:text-slate-800"
            }`}
          >
            <div className="relative">
              <Bookmark className="w-5 h-5 mb-0.5" />
              {vocabList.length > 0 && (
                <span className="absolute -top-1 -right-2 bg-pink-500 text-white text-[9px] font-bold px-1.5 py-0.2 rounded-full min-w-[16px] text-center">
                  {vocabList.length}
                </span>
              )}
            </div>
            <span className="text-[11px]">生词本</span>
          </button>
        </div>
      </nav>
    </div>
  );
}
