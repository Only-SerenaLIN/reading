import React, { useState } from "react";
import {
  X,
  Key,
  Zap,
  CheckCircle2,
  Sliders,
  Volume2,
  ShieldCheck,
  Sparkles,
  Headphones,
} from "lucide-react";
import { GeminiVoiceName } from "../types";
import { playGeminiTTS } from "../utils/geminiTTS";

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  apiKey: string;
  onSaveApiKey: (key: string) => void;
  serverHasKey: boolean;
  geminiVoice: GeminiVoiceName;
  onChangeGeminiVoice: (voice: GeminiVoiceName) => void;
  maxDimension: number;
  onChangeMaxDimension: (dim: number) => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  onClose,
  apiKey,
  onSaveApiKey,
  serverHasKey,
  geminiVoice,
  onChangeGeminiVoice,
  maxDimension,
  onChangeMaxDimension,
}) => {
  const [inputVal, setInputVal] = useState(apiKey);
  const [savedMsg, setSavedMsg] = useState(false);

  if (!isOpen) return null;

  const handleSave = () => {
    onSaveApiKey(inputVal.trim());
    setSavedMsg(true);
    setTimeout(() => {
      setSavedMsg(false);
      onClose();
    }, 600);
  };

  const voiceOptions: {
    name: GeminiVoiceName;
    label: string;
    desc: string;
    gender: string;
  }[] = [
    {
      name: "Zephyr",
      label: "Zephyr (推荐)",
      desc: "知性温润 • 极度自然美音女声",
      gender: "女声",
    },
    {
      name: "Puck",
      label: "Puck",
      desc: "阳光明亮 • 活力清脆美音男声",
      gender: "男声",
    },
    {
      name: "Kore",
      label: "Kore",
      desc: "轻柔典雅 • 纯正播音范女声",
      gender: "女声",
    },
    {
      name: "Charon",
      label: "Charon",
      desc: "沉稳磁性 • 经典成熟男声",
      gender: "男声",
    },
    {
      name: "Fenrir",
      label: "Fenrir",
      desc: "庄重大气 • 深邃质感男声",
      gender: "男声",
    },
  ];

  const handlePreviewVoice = (voice: GeminiVoiceName) => {
    playGeminiTTS(
      "Hello! I am your native reading companion from Google Gemini.",
      voice,
      inputVal.trim()
    );
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl border border-slate-100 overflow-hidden flex flex-col max-h-[90vh]">
        {/* Modal Header */}
        <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/70">
          <div className="flex items-center gap-2">
            <Sliders className="w-4 h-4 text-indigo-600" />
            <h2 className="font-bold text-slate-800 text-base">系统与声音配置</h2>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 p-1 rounded-lg hover:bg-slate-200/50 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Content */}
        <div className="p-5 space-y-5 overflow-y-auto text-sm text-slate-600">
          {/* Engine Status Banner */}
          <div className="p-3.5 rounded-xl bg-gradient-to-r from-emerald-50 to-teal-50 border border-emerald-200/80">
            <div className="flex items-start gap-2.5">
              <ShieldCheck className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold text-emerald-950 text-xs sm:text-sm">
                  {serverHasKey
                    ? "Gemini 官方原生声音引擎 (24kHz WAV)"
                    : "自定义 Key 模式"}
                </p>
                <p className="text-emerald-700/90 text-xs mt-0.5 leading-relaxed">
                  已接入 Gemini 3.8 Flash-Lite TTS 原生语音模型，享受地道纯正的原著母语发音，告别机械音。
                </p>
              </div>
            </div>
          </div>

          {/* Gemini Official Voice Selector */}
          <div className="space-y-2.5">
            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center justify-between">
              <span className="flex items-center gap-1.5">
                <Headphones className="w-3.5 h-3.5 text-indigo-500" />
                Gemini 官方原声音色选择
              </span>
              <span className="text-[11px] text-indigo-600 font-normal">
                点击试听
              </span>
            </label>

            <div className="space-y-1.5">
              {voiceOptions.map((v) => (
                <div
                  key={v.name}
                  onClick={() => onChangeGeminiVoice(v.name)}
                  className={`p-2.5 rounded-xl border transition cursor-pointer flex items-center justify-between ${
                    geminiVoice === v.name
                      ? "bg-indigo-50/80 border-indigo-500 shadow-2xs"
                      : "bg-white border-slate-200 hover:bg-slate-50"
                  }`}
                >
                  <div className="space-y-0.5">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-xs text-slate-900">
                        {v.label}
                      </span>
                      <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-slate-100 text-slate-600">
                        {v.gender}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-500">{v.desc}</p>
                  </div>

                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      handlePreviewVoice(v.name);
                    }}
                    className="p-2 rounded-lg bg-white border border-slate-200 hover:bg-indigo-100 text-indigo-600 transition shadow-2xs"
                    title="试听音色"
                  >
                    <Volume2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Image Compression Setting */}
          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-indigo-500" />
              图片压缩长边尺寸 (越小速度越快)
            </label>
            <div className="grid grid-cols-2 gap-2">
              {[
                { label: "840px (⚡ 1~3秒极速推荐)", value: 840 },
                { label: "1080px (超高清清晰)", value: 1080 },
              ].map((item) => (
                <button
                  key={item.value}
                  type="button"
                  onClick={() => onChangeMaxDimension(item.value)}
                  className={`py-2 px-2 text-center rounded-xl text-xs font-semibold border transition cursor-pointer ${
                    maxDimension === item.value
                      ? "bg-indigo-600 text-white border-indigo-600 shadow-xs"
                      : "bg-white text-slate-700 border-slate-200 hover:bg-slate-50"
                  }`}
                >
                  {item.label}
                </button>
              ))}
            </div>
          </div>

          {/* API Key Configuration */}
          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
              <Key className="w-3.5 h-3.5 text-indigo-500" />
              Gemini API Key (可选覆盖)
            </label>
            <input
              type="password"
              placeholder={
                serverHasKey
                  ? "留空则默认使用服务端内置 Key"
                  : "在此粘贴 AIzaSy... 格式的 Key"
              }
              value={inputVal}
              onChange={(e) => setInputVal(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 outline-none text-xs sm:text-sm bg-white font-mono"
            />
            <p className="text-[11px] text-slate-400">
              {serverHasKey
                ? "系统已默认接入服务端内置官方 Key，开箱即用。"
                : "填入 Key 即可开启极速导读与 Gemini 原声音频合成。"}
            </p>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="px-5 py-3.5 border-t border-slate-100 flex items-center justify-end gap-2.5 bg-slate-50/70">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-200/60 transition cursor-pointer"
          >
            取消
          </button>
          <button
            onClick={handleSave}
            className="flex items-center gap-1.5 px-5 py-2 rounded-xl text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 active:scale-95 transition shadow-sm cursor-pointer"
          >
            {savedMsg ? <CheckCircle2 className="w-3.5 h-3.5" /> : null}
            <span>{savedMsg ? "已保存" : "保存配置"}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
