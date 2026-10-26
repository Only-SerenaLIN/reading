import React from "react";
import { Zap, Settings } from "lucide-react";

interface HeaderProps {
  onOpenSettings: () => void;
  serverStatus: { hasServerKey: boolean; speedOptimized: boolean };
  hasCustomKey: boolean;
}

export const Header: React.FC<HeaderProps> = ({
  onOpenSettings,
  serverStatus,
  hasCustomKey,
}) => {
  return (
    <header className="sticky top-0 z-30 bg-white/90 backdrop-blur-md border-b border-slate-200/80 px-4 py-3 sm:px-6">
      <div className="max-w-4xl mx-auto flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-indigo-600 text-white flex items-center justify-center shadow-sm shadow-indigo-200">
            <span className="text-lg">📖</span>
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <h1 className="font-bold text-slate-900 text-base sm:text-lg tracking-tight">
                原著拍照导读 Pro
              </h1>
              <span className="inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200/80">
                <Zap className="w-3 h-3 text-emerald-500 fill-emerald-500 animate-pulse" />
                极速版
              </span>
            </div>
            <p className="text-[11px] text-slate-500 hidden sm:block">
              拍照秒级提炼剧情梗 • 人物发音 • 划线难词深度语境解析
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {serverStatus.hasServerKey || hasCustomKey ? (
            <div className="hidden xs:flex items-center gap-1 text-xs text-slate-500 bg-slate-50 border border-slate-200 px-2.5 py-1 rounded-full">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping inline-block" />
              <span className="text-emerald-700 font-medium">3~5s 闪电引擎</span>
            </div>
          ) : null}

          <button
            onClick={onOpenSettings}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-indigo-700 bg-indigo-50 hover:bg-indigo-100/80 active:scale-95 transition-all rounded-full border border-indigo-200/60 cursor-pointer"
            title="设置与配置"
          >
            <Settings className="w-3.5 h-3.5" />
            <span>配置</span>
          </button>
        </div>
      </div>
    </header>
  );
};
