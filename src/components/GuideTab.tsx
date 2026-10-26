import React, { useRef, useState, useEffect } from "react";
import {
  Camera,
  Image as ImageIcon,
  Zap,
  Volume2,
  Bookmark,
  Check,
  Sparkles,
  ChevronDown,
  ChevronUp,
  Copy,
  BookOpen,
  Headphones,
  Plus,
  Trash2,
  Layers,
} from "lucide-react";
import { PageGuideResult, GeminiVoiceName } from "../types";
import { compressImage, createSampleBookPage } from "../utils/imageCompressor";
import { playGeminiTTS } from "../utils/geminiTTS";
import { AskCompanion } from "./AskCompanion";

export interface LoadedImage {
  id: string;
  dataUrl: string;
  base64: string;
  mimeType: string;
  sizeKb: number;
}

interface GuideTabProps {
  onAnalyze: (
    images: { base64: string; mimeType: string }[]
  ) => Promise<void>;
  isAnalyzing: boolean;
  result: PageGuideResult | null;
  loadedImages: LoadedImage[];
  onSetLoadedImages: React.Dispatch<React.SetStateAction<LoadedImage[]>>;
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
  maxDimension: number;
}

export const GuideTab: React.FC<GuideTabProps> = ({
  onAnalyze,
  isAnalyzing,
  result,
  loadedImages,
  onSetLoadedImages,
  isFavorited,
  onToggleFavorite,
  onShowToast,
  geminiVoice,
  apiKey,
  maxDimension,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const addMoreInputRef = useRef<HTMLInputElement>(null);
  const [showFullImages, setShowFullImages] = useState(false);
  const [elapsedTime, setElapsedTime] = useState(0);
  const [copiedNote, setCopiedNote] = useState(false);
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);
  const [currentlySpeakingText, setCurrentlySpeakingText] = useState<string | null>(null);

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

  const handleSpeak = (textToSpeak: string) => {
    setCurrentlySpeakingText(textToSpeak);
    playGeminiTTS(textToSpeak, geminiVoice, apiKey, (playing) => {
      setIsPlayingAudio(playing);
      if (!playing) setCurrentlySpeakingText(null);
    });
  };

  const handleFileChange = async (
    e: React.ChangeEvent<HTMLInputElement>,
    append = false
  ) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    try {
      onShowToast(`⚡ 正在极速压缩 ${files.length} 张图片...`);
      const fileList = Array.from(files);
      const compressedList = await Promise.all(
        fileList.map(async (file, idx) => {
          const comp = await compressImage(file, maxDimension, 0.78);
          return {
            id: `${Date.now()}_${idx}_${Math.random().toString(36).substring(2, 6)}`,
            dataUrl: comp.dataUrl,
            base64: comp.base64,
            mimeType: comp.mimeType,
            sizeKb: comp.compressedSizeKb,
          };
        })
      );

      let finalImages: LoadedImage[] = [];
      if (append) {
        finalImages = [...loadedImages, ...compressedList].slice(0, 5); // limit max 5
        onSetLoadedImages(finalImages);
        onShowToast(`已添加新书页，当前共 ${finalImages.length} 页`);
      } else {
        finalImages = compressedList.slice(0, 5);
        onSetLoadedImages(finalImages);
        // Automatically start analyzing
        await onAnalyze(
          finalImages.map((img) => ({
            base64: img.base64,
            mimeType: img.mimeType,
          }))
        );
      }
    } catch (err: any) {
      onShowToast(err.message || "图片处理失败");
    } finally {
      if (fileInputRef.current) fileInputRef.current.value = "";
      if (addMoreInputRef.current) addMoreInputRef.current.value = "";
    }
  };

  const handleRemoveImage = (id: string) => {
    onSetLoadedImages((prev) => prev.filter((img) => img.id !== id));
  };

  const handleTriggerReAnalyze = async () => {
    if (loadedImages.length === 0 || isAnalyzing) return;
    await onAnalyze(
      loadedImages.map((img) => ({
        base64: img.base64,
        mimeType: img.mimeType,
      }))
    );
  };

  const handlePickSample = async (
    novelKey: "love_hypothesis" | "harry_potter" | "gatsby" | "catcher"
  ) => {
    if (isAnalyzing) return;
    try {
      const sample = createSampleBookPage(novelKey);
      const newImg: LoadedImage = {
        id: `sample_${Date.now()}`,
        dataUrl: sample.dataUrl,
        base64: sample.base64,
        mimeType: "image/jpeg",
        sizeKb: Math.round((sample.base64.length * 0.75) / 1024),
      };
      onSetLoadedImages([newImg]);
      onShowToast(`已载入${sample.title}，开始 3 秒极速拆解...`);
      await onAnalyze([{ base64: sample.base64, mimeType: "image/jpeg" }]);
    } catch (err: any) {
      onShowToast(err.message || "加载样张失败");
    }
  };

  const copyAsMarkdown = () => {
    if (!result) return;
    let md = `${result.cheer_intro}\n\n`;

    result.sections.forEach((sec) => {
      md += `### ${sec.section_title}\n`;
      if (sec.section_story) {
        md += `${sec.section_story}\n\n`;
      }
      sec.terms.forEach((t) => {
        md += `⚬ ${t.term}: ${t.explanation}\n`;
      });
      md += `\n`;
    });

    md += `### 阅读小结\n${result.reading_summary}\n`;

    navigator.clipboard?.writeText(md);
    setCopiedNote(true);
    onShowToast("📋 已复制标准精美排版文本！");
    setTimeout(() => setCopiedNote(false), 2000);
  };

  // Extract clean word for favorite and TTS
  const extractCleanWord = (rawTerm: string) => {
    return rawTerm.split(":")[0].split("：")[0].split("(")[0].trim();
  };

  // Compile context text for the AskCompanion
  const compiledContext = result
    ? `【开场导读】：${result.cheer_intro}\n\n` +
      result.sections
        .map(
          (s) =>
            `【${s.section_title}】：${s.section_story || ""}\n重点词：` +
            s.terms.map((t) => `${t.term} (${t.explanation})`).join("; ")
        )
        .join("\n\n") +
      `\n\n【阅读小结】：${result.reading_summary}`
    : "当前尚未载入导读。";

  return (
    <div className="space-y-4">
      {/* Photo Capture & Upload Card */}
      <div className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200/80 shadow-xs">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <span className="text-base">📸</span>
            <div>
              <h2 className="font-bold text-slate-800 text-sm sm:text-base flex items-center gap-2">
                书页连拍与多图跨页导读
                <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200/80">
                  支持多张连续导入
                </span>
              </h2>
            </div>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="inline-flex items-center gap-1 text-[11px] font-semibold px-2.5 py-0.5 rounded-full bg-indigo-50 text-indigo-700">
              <Headphones className="w-3 h-3 text-indigo-500" />
              Gemini 原声 ({geminiVoice})
            </span>
          </div>
        </div>

        {/* Hidden File Inputs (multiple support) */}
        <input
          type="file"
          ref={fileInputRef}
          accept="image/*"
          multiple
          onChange={(e) => handleFileChange(e, false)}
          className="hidden"
          id="novelPageInput"
        />
        <input
          type="file"
          ref={addMoreInputRef}
          accept="image/*"
          multiple
          onChange={(e) => handleFileChange(e, true)}
          className="hidden"
          id="addMorePageInput"
        />

        {/* Action Buttons */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
          <label
            htmlFor="novelPageInput"
            className={`flex items-center justify-center gap-2 px-4 py-3.5 rounded-xl font-semibold text-white bg-indigo-600 hover:bg-indigo-700 active:scale-98 transition shadow-xs cursor-pointer text-sm ${
              isAnalyzing ? "opacity-60 pointer-events-none" : ""
            }`}
          >
            <Camera className="w-4 h-4" />
            <span>📷 连拍/批量选多张书页</span>
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
            <span>从相册多选书页 (1~5张)</span>
          </button>
        </div>

        {/* 1-Tap Preset Samples */}
        <div className="mt-3.5 pt-3 border-t border-slate-100">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs text-slate-500 font-medium flex items-center gap-1">
              <Zap className="w-3 h-3 text-amber-500 fill-amber-500" />
              一键秒测经典段落：
            </span>
          </div>
          <div className="flex flex-wrap gap-1.5">
            {[
              {
                key: "love_hypothesis",
                label: "🧪《假戏真做》居里夫妇冷知识与神助攻 (点这个！)",
                highlight: true,
              },
              { key: "harry_potter", label: "🪄《哈利·波特》第1页" },
              { key: "gatsby", label: "🍸《了不起的盖茨比》" },
              { key: "catcher", label: "🧢《麦田里的守望者》" },
            ].map((sample) => (
              <button
                key={sample.key}
                type="button"
                disabled={isAnalyzing}
                onClick={() =>
                  handlePickSample(
                    sample.key as
                      | "love_hypothesis"
                      | "harry_potter"
                      | "gatsby"
                      | "catcher"
                  )
                }
                className={`text-xs px-2.5 py-1.5 rounded-lg font-medium border transition cursor-pointer active:scale-95 disabled:opacity-50 ${
                  sample.highlight
                    ? "bg-indigo-600 text-white border-indigo-700 shadow-2xs font-semibold"
                    : "bg-indigo-50/70 hover:bg-indigo-100/90 text-indigo-700 border-indigo-200/50"
                }`}
              >
                {sample.label}
              </button>
            ))}
          </div>
        </div>

        {/* Multi-Photo Carousel / Thumbnail Strip */}
        {loadedImages.length > 0 && (
          <div className="mt-3.5 pt-3 border-t border-slate-100 space-y-2.5">
            <div className="flex items-center justify-between text-xs text-slate-500">
              <span className="flex items-center gap-1.5 font-medium">
                <Layers className="w-3.5 h-3.5 text-indigo-500" />
                已导入 {loadedImages.length} 张书页（按先后阅读顺序）
              </span>
              <div className="flex items-center gap-3">
                <label
                  htmlFor="addMorePageInput"
                  className="text-indigo-600 hover:text-indigo-800 font-semibold cursor-pointer flex items-center gap-0.5"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>加一页</span>
                </label>
                <button
                  type="button"
                  onClick={() => setShowFullImages(!showFullImages)}
                  className="text-slate-500 hover:text-slate-800 flex items-center gap-0.5 font-semibold cursor-pointer"
                >
                  {showFullImages ? "收起" : "展开"}
                  {showFullImages ? (
                    <ChevronUp className="w-3.5 h-3.5" />
                  ) : (
                    <ChevronDown className="w-3.5 h-3.5" />
                  )}
                </button>
              </div>
            </div>

            {/* Thumbnails Row */}
            <div className="flex items-center gap-2.5 overflow-x-auto pb-1.5 pt-0.5">
              {loadedImages.map((img, idx) => (
                <div
                  key={img.id}
                  className="relative group shrink-0 rounded-xl overflow-hidden border-2 border-indigo-200/80 bg-slate-100 w-24 h-32"
                >
                  <img
                    src={img.dataUrl}
                    alt={`第 ${idx + 1} 页`}
                    className="w-full h-full object-cover"
                  />
                  {/* Page Badge */}
                  <span className="absolute bottom-1 left-1 bg-slate-900/80 text-white text-[10px] font-bold px-1.5 py-0.2 rounded-md">
                    第 {idx + 1} 页
                  </span>
                  {/* Remove Button */}
                  <button
                    type="button"
                    onClick={() => handleRemoveImage(img.id)}
                    className="absolute top-1 right-1 bg-rose-600 text-white p-1 rounded-full opacity-90 hover:opacity-100 transition cursor-pointer"
                    title="删除此页"
                  >
                    <Trash2 className="w-3 h-3" />
                  </button>
                </div>
              ))}

              {/* Add More Tile */}
              {loadedImages.length < 5 && (
                <label
                  htmlFor="addMorePageInput"
                  className="shrink-0 rounded-xl border-2 border-dashed border-slate-300 hover:border-indigo-400 bg-slate-50/70 hover:bg-indigo-50/40 w-24 h-32 flex flex-col items-center justify-center gap-1.5 cursor-pointer text-slate-400 hover:text-indigo-600 transition"
                >
                  <Plus className="w-5 h-5" />
                  <span className="text-[11px] font-medium">+ 继续加页</span>
                </label>
              )}
            </div>

            {/* Re-analyze Button if user modified pages */}
            {!isAnalyzing && (
              <button
                type="button"
                onClick={handleTriggerReAnalyze}
                className="w-full py-2.5 rounded-xl font-semibold text-xs text-indigo-700 bg-indigo-50 hover:bg-indigo-100 transition flex items-center justify-center gap-1.5 border border-indigo-200/60 cursor-pointer"
              >
                <Zap className="w-3.5 h-3.5" />
                <span>分析这 {loadedImages.length} 页跨页内容</span>
              </button>
            )}

            {/* Expandable Preview */}
            {showFullImages && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                {loadedImages.map((img, idx) => (
                  <div
                    key={img.id}
                    className="rounded-xl overflow-hidden border border-slate-200 bg-slate-900/5 p-1"
                  >
                    <span className="text-xs font-bold text-slate-700 block p-1">
                      书页 {idx + 1} ({img.sizeKb}KB)
                    </span>
                    <img
                      src={img.dataUrl}
                      alt={`第 ${idx + 1} 页`}
                      className="w-full max-h-72 object-contain mx-auto"
                    />
                  </div>
                ))}
              </div>
            )}
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
                导师正在跨页连贯拆解词汇与情节...
              </h3>
            </div>
            <span className="font-mono text-xs font-bold text-indigo-600 bg-indigo-100/80 px-2.5 py-1 rounded-full">
              ⏱️ {elapsedTime}s
            </span>
          </div>

          <p className="text-xs text-indigo-700/80 leading-relaxed">
            🚀 正在解析书页标注、章节标题、人物设定、地道俚语文化梗与阅读小结...
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

      {/* Floating Audio Playback Banner */}
      {isPlayingAudio && (
        <div className="sticky top-16 z-20 bg-indigo-900/90 backdrop-blur-md text-white px-4 py-2.5 rounded-2xl shadow-lg border border-indigo-700 flex items-center justify-between text-xs animate-in slide-in-from-top-2 duration-200">
          <div className="flex items-center gap-2 truncate pr-2">
            <Volume2 className="w-4 h-4 text-emerald-400 animate-pulse shrink-0" />
            <span className="font-semibold text-indigo-200 shrink-0">
              Gemini 官方原声播报中:
            </span>
            <span className="truncate italic text-slate-100">
              "{currentlySpeakingText}"
            </span>
          </div>
          <span className="text-[10px] bg-indigo-700 px-2 py-0.5 rounded-full shrink-0 text-indigo-200">
            {geminiVoice} 24kHz
          </span>
        </div>
      )}

      {/* Guide Results Section */}
      {result && !isAnalyzing && (
        <div className="space-y-4 animate-in fade-in duration-300">
          {/* Top Actions */}
          <div className="flex items-center justify-between px-1">
            <span className="text-xs text-slate-500 font-medium">
              ✨ 导读已生成 ({result.durationMs ? `${(result.durationMs / 1000).toFixed(1)}s 完成` : "耗时约 3s"})
            </span>
            <button
              type="button"
              onClick={copyAsMarkdown}
              className="flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-full bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 transition cursor-pointer shadow-2xs"
            >
              {copiedNote ? (
                <Check className="w-3.5 h-3.5 text-emerald-600" />
              ) : (
                <Copy className="w-3.5 h-3.5 text-slate-500" />
              )}
              <span>{copiedNote ? "已复制整篇排版" : "复制完整精美笔记"}</span>
            </button>
          </div>

          {/* 1. Encouraging Intro Banner */}
          {result.cheer_intro && (
            <div className="rounded-2xl bg-gradient-to-r from-indigo-50 via-purple-50 to-pink-50 p-4 sm:p-5 border border-indigo-200/80 shadow-xs">
              <div className="flex items-start gap-3">
                <span className="text-2xl mt-0.5">🎉</span>
                <div className="space-y-1">
                  <h3 className="font-bold text-indigo-950 text-sm sm:text-base leading-snug">
                    原著私教导读拆解
                  </h3>
                  <p className="text-xs sm:text-sm text-slate-700 leading-relaxed font-sans">
                    {result.cheer_intro}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* 2. Chronological Section-by-Section Breakdown */}
          {result.sections &&
            result.sections.map((section, sIdx) => (
              <div
                key={sIdx}
                className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs space-y-3.5"
              >
                {/* Section Title */}
                <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
                  <h4 className="font-bold text-slate-900 text-sm sm:text-base flex items-center gap-2">
                    <span className="w-2 h-4 rounded-full bg-indigo-600 inline-block" />
                    {section.section_title}
                  </h4>
                  <span className="text-[11px] font-medium text-slate-400">
                    第 {sIdx + 1} 部分
                  </span>
                </div>

                {/* Section Story & Background Nuance */}
                {section.section_story && (
                  <p className="text-xs sm:text-sm text-slate-600 bg-slate-50 p-3 rounded-xl border border-slate-100 leading-relaxed">
                    {section.section_story}
                  </p>
                )}

                {/* Section Terms List */}
                <div className="space-y-3 pt-1">
                  {section.terms.map((item, tIdx) => {
                    const cleanWord = extractCleanWord(item.term);
                    const favorited = isFavorited(cleanWord);
                    return (
                      <div
                        key={tIdx}
                        className="p-3.5 rounded-xl bg-slate-50/70 hover:bg-slate-50 border border-slate-200/60 transition group space-y-1.5"
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div className="space-y-0.5">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="text-indigo-500 font-bold">⚬</span>
                              <span
                                onClick={() => handleSpeak(cleanWord)}
                                className="font-bold text-sm sm:text-base text-slate-900 hover:text-indigo-600 cursor-pointer tracking-tight"
                              >
                                {item.term}
                              </span>
                              {item.phonetic && (
                                <span className="font-mono text-[11px] text-slate-500 bg-white px-2 py-0.5 rounded border border-slate-200">
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
                            {/* Gemini TTS Audio Button */}
                            <button
                              type="button"
                              onClick={() => handleSpeak(cleanWord)}
                              className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-indigo-50 hover:bg-indigo-100 text-indigo-700 text-xs font-semibold transition cursor-pointer"
                              title="Gemini 官方原声朗读"
                            >
                              <Volume2 className="w-3.5 h-3.5 text-indigo-600" />
                              <span className="text-[11px]">原声</span>
                            </button>

                            {/* Bookmark Button */}
                            <button
                              type="button"
                              onClick={() =>
                                onToggleFavorite({
                                  word: cleanWord,
                                  phonetic: item.phonetic,
                                  meaning: item.explanation,
                                  context: item.context,
                                  tag: item.tag,
                                })
                              }
                              className={`p-1.5 rounded-lg text-xs font-semibold transition cursor-pointer ${
                                favorited
                                  ? "bg-amber-100 text-amber-800 border border-amber-300"
                                  : "bg-white text-slate-400 hover:text-slate-600 border border-slate-200"
                              }`}
                              title={favorited ? "已存入生词本" : "存入生词本"}
                            >
                              <Bookmark
                                className={`w-3.5 h-3.5 ${
                                  favorited
                                    ? "fill-amber-600 text-amber-600"
                                    : "text-slate-400"
                                }`}
                              />
                            </button>
                          </div>
                        </div>

                        {/* Explanation */}
                        <div className="text-xs sm:text-sm text-slate-700 leading-relaxed pl-3.5">
                          {item.explanation}
                        </div>

                        {/* Novel Quote Context */}
                        {item.context && (
                          <div
                            onClick={() => handleSpeak(item.context!)}
                            className="text-xs italic text-slate-500 bg-white p-2.5 rounded-lg border-l-2 border-indigo-400 cursor-pointer flex items-start justify-between gap-2 group/q transition ml-3.5 hover:bg-indigo-50/40"
                            title="点击试听原句读音"
                          >
                            <span className="leading-relaxed font-serif">
                              “{item.context}”
                            </span>
                            <Volume2 className="w-3 h-3 text-slate-400 group-hover/q:text-indigo-600 shrink-0 mt-0.5" />
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}

          {/* 3. Reading Takeaway Summary */}
          {result.reading_summary && (
            <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs space-y-2">
              <div className="flex items-center gap-2 text-indigo-900 font-bold text-sm sm:text-base">
                <span className="text-base">💡</span>
                <h4>阅读小结与人设分析</h4>
              </div>
              <div className="rounded-xl bg-gradient-to-r from-slate-50 to-indigo-50/50 p-4 text-xs sm:text-sm text-slate-700 leading-relaxed border-l-4 border-indigo-500">
                {result.reading_summary}
              </div>
            </div>
          )}

          {/* 4. Ask Gemini Reading Companion (查漏补缺) */}
          <AskCompanion
            contextGuide={compiledContext}
            geminiVoice={geminiVoice}
            apiKey={apiKey}
            onShowToast={onShowToast}
          />
        </div>
      )}
    </div>
  );
};
