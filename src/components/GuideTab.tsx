import React, { useRef, useState, useEffect } from "react";
import {
  Camera,
  Image as ImageIcon,
  Zap,
  Volume2,
  Bookmark,
  Check,
  RotateCcw,
  Sparkles,
  ChevronDown,
  ChevronUp,
  Copy,
  BookOpen,
  Share2,
} from "lucide-react";
import { PageGuideResult, HighlightedWord, CharacterItem } from "../types";
import { compressImage, createSampleBookPage } from "../utils/imageCompressor";
import { speakEnglish } from "../utils/speech";

interface GuideTabProps {
  onAnalyze: (base64: string, mimeType: string) => Promise<void>;
  isAnalyzing: boolean;
  result: PageGuideResult | null;
  previewUrl: string | null;
  onSetPreviewUrl: (url: string | null) => void;
  isFavorited: (word: string) => boolean;
  onToggleFavorite: (item: HighlightedWord) => void;
  onShowToast: (msg: string) => void;
  speechRate: number;
  maxDimension: number;
}

export const GuideTab: React.FC<GuideTabProps> = ({
  onAnalyze,
  isAnalyzing,
  result,
  previewUrl,
  onSetPreviewUrl,
  isFavorited,
  onToggleFavorite,
  onShowToast,
  speechRate,
  maxDimension,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [compressInfo, setCompressInfo] = useState<{
    origKb: number;
    compKb: number;
    ratio: number;
  } | null>(null);
  const [showFullImage, setShowFullImage] = useState(false);
  const [elapsedTime, setElapsedTime] = useState(0);
  const [copiedNote, setCopiedNote] = useState(false);

  // Timer while analyzing
  useEffect(() => {
    let interval: any;
    if (isAnalyzing) {
      setElapsedTime(0);
      const start = Date.now();
      interval = setInterval(() => {
        setElapsedTime(Number(((Date.now() - start) / 1000).toFixed(1)));
      }, 100);
    }
    return () => clearInterval(interval);
  }, [isAnalyzing]);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      onShowToast("⚡ 正在极速压缩优化图片...");
      const compressed = await compressImage(file, maxDimension, 0.82);
      onSetPreviewUrl(compressed.dataUrl);
      setCompressInfo({
        origKb: compressed.originalSizeKb,
        compKb: compressed.compressedSizeKb,
        ratio: compressed.compressionRatio,
      });

      await onAnalyze(compressed.base64, compressed.mimeType);
    } catch (err: any) {
      onShowToast(err.message || "图片处理失败");
    } finally {
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const handlePickSample = async (novelKey: "harry_potter" | "gatsby" | "catcher") => {
    if (isAnalyzing) return;
    try {
      const sample = createSampleBookPage(novelKey);
      onSetPreviewUrl(sample.dataUrl);
      setCompressInfo({
        origKb: 850,
        compKb: Math.round((sample.base64.length * 0.75) / 1024),
        ratio: 82,
      });
      onShowToast(`已载入${sample.title}，开始 3 秒极速导读...`);
      await onAnalyze(sample.base64, "image/jpeg");
    } catch (err: any) {
      onShowToast(err.message || "加载样张失败");
    }
  };

  const copyFullGuide = () => {
    if (!result) return;
    let text = `📖 原著导读笔记\n\n【本页剧情导读】\n${result.summary}\n\n`;
    if (result.characters && result.characters.length > 0) {
      text += `【人物/专有名词】\n`;
      result.characters.forEach((c) => {
        text += `• ${c.name} [${c.phonetic}]: ${c.desc}\n`;
      });
      text += `\n`;
    }
    if (result.highlighted_words && result.highlighted_words.length > 0) {
      text += `【精选生词与文化梗】\n`;
      result.highlighted_words.forEach((w) => {
        text += `• ${w.word} [${w.phonetic}]\n  释义: ${w.meaning}\n  原句: "${w.context}"\n\n`;
      });
    }
    navigator.clipboard?.writeText(text);
    setCopiedNote(true);
    onShowToast("📋 导读精髓已复制到剪贴板！");
    setTimeout(() => setCopiedNote(false), 2000);
  };

  return (
    <div className="space-y-4">
      {/* Photo Capture & Upload Card */}
      <div className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200/80 shadow-xs">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <span className="text-base">📸</span>
            <h2 className="font-bold text-slate-800 text-sm sm:text-base">
              书页扫描与即时导读
            </h2>
          </div>
          <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-indigo-50 text-indigo-700">
            {isAnalyzing
              ? `⚡ 极速生成中 (${elapsedTime}s)`
              : result
              ? "✅ 导读已生成"
              : "准备就绪"}
          </span>
        </div>

        {/* Hidden Camera Input */}
        <input
          type="file"
          ref={fileInputRef}
          accept="image/*"
          capture="environment"
          onChange={handleFileChange}
          className="hidden"
          id="novelPageInput"
        />

        {/* Photo Action Buttons */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
          <label
            htmlFor="novelPageInput"
            className={`flex items-center justify-center gap-2 px-4 py-3.5 rounded-xl font-semibold text-white bg-indigo-600 hover:bg-indigo-700 active:scale-98 transition shadow-xs cursor-pointer text-sm ${
              isAnalyzing ? "opacity-60 pointer-events-none" : ""
            }`}
          >
            <Camera className="w-4 h-4" />
            <span>📷 拍下书页 / 选相册</span>
          </label>

          <button
            type="button"
            onClick={() => {
              if (fileInputRef.current) {
                fileInputRef.current.removeAttribute("capture");
                fileInputRef.current.click();
              }
            }}
            disabled={isAnalyzing}
            className="flex items-center justify-center gap-2 px-4 py-3.5 rounded-xl font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200/80 active:scale-98 transition cursor-pointer text-sm"
          >
            <ImageIcon className="w-4 h-4 text-slate-600" />
            <span>从相册选择文件</span>
          </button>
        </div>

        {/* 1-Tap Sample Testing Section */}
        <div className="mt-3.5 pt-3 border-t border-slate-100">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs text-slate-500 font-medium flex items-center gap-1">
              <Zap className="w-3 h-3 text-amber-500 fill-amber-500" />
              无需拿书，一键实测 3~5 秒极速：
            </span>
          </div>
          <div className="flex flex-wrap gap-1.5">
            {[
              { key: "harry_potter", label: "🪄《哈利·波特》第1页" },
              { key: "gatsby", label: "🍸《了不起的盖茨比》" },
              { key: "catcher", label: "🧢《麦田里的守望者》" },
            ].map((sample) => (
              <button
                key={sample.key}
                type="button"
                disabled={isAnalyzing}
                onClick={() =>
                  handlePickSample(sample.key as "harry_potter" | "gatsby" | "catcher")
                }
                className="text-xs px-2.5 py-1.5 rounded-lg bg-indigo-50/70 hover:bg-indigo-100/90 text-indigo-700 font-medium border border-indigo-200/50 transition cursor-pointer active:scale-95 disabled:opacity-50"
              >
                {sample.label}
              </button>
            ))}
          </div>
        </div>

        {/* Image Preview & Compression Badge */}
        {previewUrl && (
          <div className="mt-3.5 pt-3 border-t border-slate-100">
            <div className="flex items-center justify-between text-xs text-slate-500 mb-2">
              <span className="flex items-center gap-1.5 font-medium">
                <BookOpen className="w-3.5 h-3.5 text-indigo-500" />
                已载入书页
                {compressInfo && (
                  <span className="text-[11px] text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200/60">
                    已秒级压缩 {compressInfo.compKb}KB (节省 {compressInfo.ratio}%)
                  </span>
                )}
              </span>
              <button
                type="button"
                onClick={() => setShowFullImage(!showFullImage)}
                className="text-indigo-600 hover:text-indigo-800 flex items-center gap-0.5 font-semibold cursor-pointer"
              >
                {showFullImage ? "收起照片" : "查看照片"}
                {showFullImage ? (
                  <ChevronUp className="w-3.5 h-3.5" />
                ) : (
                  <ChevronDown className="w-3.5 h-3.5" />
                )}
              </button>
            </div>

            <div
              className={`overflow-hidden rounded-xl bg-slate-900/5 border border-slate-200 transition-all ${
                showFullImage ? "max-h-[500px]" : "max-h-36"
              }`}
            >
              <img
                src={previewUrl}
                alt="书页预览"
                className="w-full object-contain mx-auto"
                style={{ maxHeight: showFullImage ? "500px" : "144px" }}
              />
            </div>
          </div>
        )}
      </div>

      {/* Real-time Progress Countdown / Loading Box */}
      {isAnalyzing && (
        <div className="bg-gradient-to-br from-indigo-50 via-white to-purple-50 rounded-2xl p-5 border border-indigo-200 shadow-sm animate-pulse space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Zap className="w-5 h-5 text-indigo-600 animate-bounce" />
              <h3 className="font-bold text-indigo-950 text-sm sm:text-base">
                AI 正在极速提炼导读与生词梗...
              </h3>
            </div>
            <span className="font-mono text-xs font-bold text-indigo-600 bg-indigo-100/80 px-2.5 py-1 rounded-full">
              ⏱️ {elapsedTime}s
            </span>
          </div>

          <p className="text-xs text-indigo-700/80 leading-relaxed">
            🚀 正在利用轻量化视觉编码与低延迟推理，提炼剧情槽点、人物发音及核心划线难词...
          </p>

          <div className="w-full bg-indigo-100 rounded-full h-2 overflow-hidden">
            <div
              className="bg-indigo-600 h-2 rounded-full transition-all duration-300"
              style={{
                width: `${Math.min(95, elapsedTime * 25)}%`,
              }}
            />
          </div>
        </div>
      )}

      {/* Guide Results Section */}
      {result && !isAnalyzing && (
        <div className="space-y-4 animate-in fade-in duration-300">
          {/* Quick Toolbar */}
          <div className="flex items-center justify-between px-1">
            <span className="text-xs text-slate-500 font-medium">
              ✨ 导读已生成 ({result.durationMs ? `${(result.durationMs / 1000).toFixed(1)}s 完成` : "耗时约 3s"})
            </span>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={copyFullGuide}
                className="flex items-center gap-1 text-xs font-semibold px-3 py-1.5 rounded-full bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 transition cursor-pointer shadow-2xs"
              >
                {copiedNote ? (
                  <Check className="w-3.5 h-3.5 text-emerald-600" />
                ) : (
                  <Copy className="w-3.5 h-3.5 text-slate-500" />
                )}
                <span>{copiedNote ? "已复制笔记" : "复制导读笔记"}</span>
              </button>
            </div>
          </div>

          {/* 1. Page Summary & Humor Card */}
          <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs relative overflow-hidden">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <span className="text-base">✨</span>
                <h3 className="font-bold text-slate-800 text-sm sm:text-base">
                  本页剧情导读与幽默梗
                </h3>
              </div>
              <button
                type="button"
                onClick={() => speakEnglish(result.summary, speechRate)}
                className="flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-full bg-indigo-50 hover:bg-indigo-100 text-indigo-700 transition cursor-pointer"
                title="朗读概述"
              >
                <Volume2 className="w-3 h-3" />
                <span>朗读</span>
              </button>
            </div>

            <div className="rounded-xl bg-gradient-to-r from-indigo-50/70 via-purple-50/50 to-pink-50/40 p-4 border-l-4 border-indigo-600 text-slate-800 text-sm leading-relaxed whitespace-pre-line font-serif-reading">
              {result.summary}
            </div>
          </div>

          {/* 2. Characters & Proper Nouns Card */}
          {result.characters && result.characters.length > 0 && (
            <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <span className="text-base">👤</span>
                  <h3 className="font-bold text-slate-800 text-sm sm:text-base">
                    出场人物 & 专有名词读音
                  </h3>
                </div>
                <span className="text-xs text-slate-400">点击名字听发音</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {result.characters.map((char, idx) => (
                  <div
                    key={idx}
                    className="p-3 rounded-xl bg-slate-50/80 border border-slate-200/60 hover:border-indigo-300 transition group"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <div>
                        <span
                          onClick={() => speakEnglish(char.name, speechRate)}
                          className="font-bold text-indigo-700 text-sm group-hover:text-indigo-900 cursor-pointer flex items-center gap-1.5"
                        >
                          {char.name}
                          <Volume2 className="w-3.5 h-3.5 text-indigo-400 group-hover:text-indigo-600 shrink-0" />
                        </span>
                        {char.phonetic && (
                          <span className="text-[11px] font-mono text-slate-500 block">
                            [{char.phonetic}]
                          </span>
                        )}
                      </div>
                    </div>
                    <p className="text-xs text-slate-600 mt-1.5 leading-normal">
                      {char.desc}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 3. Highlighted Words & Cultural Idioms */}
          <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <span className="text-base">✍️</span>
                <h3 className="font-bold text-slate-800 text-sm sm:text-base">
                  划线生词深度解析 (语境梗 • 例句 • 收藏)
                </h3>
              </div>
              <span className="text-xs text-slate-400">
                共 {result.highlighted_words?.length || 0} 个词
              </span>
            </div>

            <div className="divide-y divide-slate-100">
              {result.highlighted_words && result.highlighted_words.length > 0 ? (
                result.highlighted_words.map((item, idx) => {
                  const favorited = isFavorited(item.word);
                  return (
                    <div key={idx} className="py-3.5 first:pt-0 last:pb-0">
                      <div className="flex items-start justify-between gap-2">
                        <div className="space-y-0.5">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span
                              onClick={() => speakEnglish(item.word, speechRate)}
                              className="font-bold text-base sm:text-lg text-indigo-700 hover:text-indigo-900 cursor-pointer tracking-tight"
                            >
                              {item.word}
                            </span>
                            {item.phonetic && (
                              <span className="font-mono text-xs text-slate-500 bg-slate-100 px-2 py-0.5 rounded-md">
                                [{item.phonetic}]
                              </span>
                            )}
                          </div>
                        </div>

                        <div className="flex items-center gap-1.5 shrink-0">
                          <button
                            type="button"
                            onClick={() => speakEnglish(item.word, speechRate)}
                            className="p-1.5 rounded-lg bg-indigo-50 text-indigo-700 hover:bg-indigo-100 transition cursor-pointer"
                            title="朗读发音"
                          >
                            <Volume2 className="w-4 h-4" />
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              onToggleFavorite(item);
                            }}
                            className={`flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer ${
                              favorited
                                ? "bg-amber-100 text-amber-800 border border-amber-300"
                                : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                            }`}
                          >
                            <Bookmark
                              className={`w-3.5 h-3.5 ${
                                favorited
                                  ? "fill-amber-600 text-amber-600"
                                  : "text-slate-500"
                              }`}
                            />
                            <span>{favorited ? "已收藏" : "收藏"}</span>
                          </button>
                        </div>
                      </div>

                      {/* Contextual Meaning */}
                      <p className="text-xs sm:text-sm text-slate-700 mt-2 leading-relaxed">
                        {item.meaning}
                      </p>

                      {/* Novel Quote Context */}
                      {item.context && (
                        <div
                          onClick={() => speakEnglish(item.context, speechRate)}
                          className="mt-2 text-xs italic text-slate-500 bg-slate-50 hover:bg-slate-100/90 p-2.5 rounded-xl border-l-3 border-indigo-400 cursor-pointer flex items-start justify-between gap-2 group transition"
                          title="点击朗读原句"
                        >
                          <span className="leading-relaxed font-serif">
                            “{item.context}”
                          </span>
                          <Volume2 className="w-3.5 h-3.5 text-slate-400 group-hover:text-indigo-600 shrink-0 mt-0.5" />
                        </div>
                      )}
                    </div>
                  );
                })
              ) : (
                <div className="py-6 text-center text-xs text-slate-400">
                  本页语言通俗平实，暂无生僻难词。
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
