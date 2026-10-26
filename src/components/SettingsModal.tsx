import React, { useState } from "react";
import { X, Key, Zap, CheckCircle2, Sliders, Volume2, ShieldCheck, Sparkles } from "lucide-react";

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  apiKey: string;
  onSaveApiKey: (key: string) => void;
  serverHasKey: boolean;
  speechRate: number;
  onChangeSpeechRate: (rate: number) => void;
  maxDimension: number;
  onChangeMaxDimension: (dim: number) => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  onClose,
  apiKey,
  onSaveApiKey,
  serverHasKey,
  speechRate,
  onChangeSpeechRate,
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

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl border border-slate-100 overflow-hidden flex flex-col max-h-[90vh]">
        {/* Modal Header */}
        <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/70">
          <div className="flex items-center gap-2">
            <Sliders className="w-4 h-4 text-indigo-600" />
            <h2 className="font-bold text-slate-800 text-base">系统与极速引擎配置</h2>
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
                  {serverHasKey ? "服务端 Gemini 3.8 Flash 已就绪" : "自定义 Key 模式"}
                </p>
                <p className="text-emerald-700/90 text-xs mt-0.5 leading-relaxed">
                  {serverHasKey
                    ? "已自动启用服务器端高速通道，无需额外手动配置即可极速解析。"
                    : "请填入你的 Gemini API Key，即可开启秒级导读。"}
                </p>
              </div>
            </div>
          </div>

          {/* Speed Optimization Breakdown */}
          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
              <Zap className="w-3.5 h-3.5 text-amber-500" />
              极速为什么能达到 3~5 秒？
            </label>
            <div className="bg-slate-50 rounded-xl p-3 border border-slate-200/70 space-y-2 text-xs text-slate-600">
              <div className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 shrink-0" />
                <span>
                  <strong>精简结构化 Prompt：</strong>抛弃全文逐字 OCR 生成，只提取核心剧情梗与难词，省去 80% Token 生成时间。
                </span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 shrink-0" />
                <span>
                  <strong>端侧瞬时压缩：</strong>高分辨率照片在浏览器秒压至 960~1080px，图像传输毫秒级完成。
                </span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 shrink-0" />
                <span>
                  <strong>低延迟推理 (Thinking Level: LOW)：</strong>直奔主题，消除冗长思考挂起。
                </span>
              </div>
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
              placeholder={serverHasKey ? "留空则默认使用服务端内置 Key" : "在此粘贴 AIzaSy... 格式的 Key"}
              value={inputVal}
              onChange={(e) => setInputVal(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 outline-none text-xs sm:text-sm bg-white font-mono"
            />
            <p className="text-[11px] text-slate-400">
              {serverHasKey
                ? "系统已默认启用官方环境 Key。如需使用自己的专有 Key 可在此填入并覆盖。"
                : "Key 仅保存在你的浏览器本地，直接与官方 API 安全通信。"}
            </p>
          </div>

          {/* Speech Rate Control */}
          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
              <Volume2 className="w-3.5 h-3.5 text-indigo-500" />
              英语朗读语速 (Web Speech)
            </label>
            <div className="grid grid-cols-3 gap-2">
              {[
                { label: "0.8x (慢速研读)", value: 0.8 },
                { label: "0.9x (原著自然)", value: 0.9 },
                { label: "1.0x (常速听力)", value: 1.0 },
              ].map((item) => (
                <button
                  key={item.value}
                  type="button"
                  onClick={() => onChangeSpeechRate(item.value)}
                  className={`py-2 px-1 text-center rounded-xl text-xs font-semibold border transition cursor-pointer ${
                    speechRate === item.value
                      ? "bg-indigo-600 text-white border-indigo-600 shadow-xs"
                      : "bg-white text-slate-700 border-slate-200 hover:bg-slate-50"
                  }`}
                >
                  {item.label}
                </button>
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
                { label: "960px (极速 3秒推荐)", value: 960 },
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
