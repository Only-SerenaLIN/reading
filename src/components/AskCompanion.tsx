import React, { useState, useRef, useEffect } from "react";
import {
  MessageSquareQuote,
  Send,
  Sparkles,
  Volume2,
  Zap,
  HelpCircle,
  Lightbulb,
  CornerDownRight,
  User,
  Bot,
} from "lucide-react";
import { GeminiVoiceName } from "../types";
import { playGeminiTTS } from "../utils/geminiTTS";

interface ChatMessage {
  id: string;
  role: "user" | "model";
  text: string;
  timestamp: string;
}

interface AskCompanionProps {
  contextGuide: string;
  geminiVoice: GeminiVoiceName;
  apiKey: string;
  onShowToast: (msg: string) => void;
}

export const AskCompanion: React.FC<AskCompanionProps> = ({
  contextGuide,
  geminiVoice,
  apiKey,
  onShowToast,
}) => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputValue, setInputValue] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const quickQuestions = [
    "这页里最难懂的长难句怎么理解？请拆解语法结构",
    "作者在这里用的几个俚语在日常生活里怎么用？",
    "主角这里的内心独白和反常举动有什么深层心理？",
    "这一章的标题和剧情有什么隐喻联系？",
  ];

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    if (messages.length > 0) {
      scrollToBottom();
    }
  }, [messages, isLoading]);

  const handleSend = async (questionText?: string) => {
    const q = (questionText || inputValue).trim();
    if (!q) return;

    const userMsg: ChatMessage = {
      id: `u_${Date.now()}`,
      role: "user",
      text: q,
      timestamp: new Date().toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
      }),
    };

    setMessages((prev) => [...prev, userMsg]);
    if (!questionText) setInputValue("");
    setIsLoading(true);

    try {
      const headers: Record<string, string> = {
        "Content-Type": "application/json",
      };
      if (apiKey && apiKey.trim()) {
        headers["x-gemini-api-key"] = apiKey.trim();
      }

      const res = await fetch("/api/ask-companion", {
        method: "POST",
        headers,
        body: JSON.stringify({
          question: q,
          contextGuide,
          history: messages.map((m) => ({ role: m.role, text: m.text })),
        }),
      });

      const json = await res.json();
      if (!res.ok || json.error) {
        throw new Error(json.error || "获取导师解答失败");
      }

      const botMsg: ChatMessage = {
        id: `m_${Date.now()}`,
        role: "model",
        text: json.answer,
        timestamp: new Date().toLocaleTimeString([], {
          hour: "2-digit",
          minute: "2-digit",
        }),
      };

      setMessages((prev) => [...prev, botMsg]);
    } catch (err: any) {
      onShowToast(`咨询失败: ${err.message || "请稍后重试"}`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSpeakText = (text: string) => {
    // Extract first English sentence or quote if exists
    const match = text.match(/["“]([a-zA-Z\s,.'?!-]+)["”]/) || text.match(/[A-Z][a-zA-Z\s,.'?!-]{8,}/);
    const textToSpeak = match ? match[1] || match[0] : text.slice(0, 80);
    playGeminiTTS(textToSpeak, geminiVoice, apiKey);
  };

  return (
    <div className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200/80 shadow-xs space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-slate-100 pb-3">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-purple-100 text-purple-700 flex items-center justify-center">
            <MessageSquareQuote className="w-4 h-4" />
          </div>
          <div>
            <h3 className="font-bold text-slate-800 text-sm sm:text-base flex items-center gap-2">
              问问 Gemini 原著私教
              <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-purple-50 text-purple-700 border border-purple-200">
                查漏补缺
              </span>
            </h3>
            <p className="text-[11px] text-slate-400">
              有没看懂的长难句、文化背景或人设疑问？随时向导师提问
            </p>
          </div>
        </div>
      </div>

      {/* Quick Prompts (if chat is fresh) */}
      {messages.length === 0 && (
        <div className="space-y-2">
          <span className="text-xs text-slate-400 font-medium flex items-center gap-1">
            <Lightbulb className="w-3.5 h-3.5 text-amber-500" />
            快速提问灵感（点击直发）：
          </span>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {quickQuestions.map((q, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => handleSend(q)}
                disabled={isLoading}
                className="text-left p-2.5 rounded-xl bg-slate-50 hover:bg-purple-50/70 border border-slate-200/60 hover:border-purple-200 text-xs text-slate-700 hover:text-purple-900 transition flex items-start gap-1.5 cursor-pointer disabled:opacity-50"
              >
                <CornerDownRight className="w-3.5 h-3.5 text-purple-500 shrink-0 mt-0.5" />
                <span className="leading-relaxed">{q}</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Messages Feed */}
      {messages.length > 0 && (
        <div className="space-y-3 max-h-[420px] overflow-y-auto pr-1">
          {messages.map((msg) => (
            <div
              key={msg.id}
              className={`flex gap-2.5 ${
                msg.role === "user" ? "justify-end" : "justify-start"
              }`}
            >
              {msg.role === "model" && (
                <div className="w-7 h-7 rounded-lg bg-purple-600 text-white flex items-center justify-center shrink-0 mt-0.5">
                  <Bot className="w-4 h-4" />
                </div>
              )}

              <div
                className={`max-w-[85%] rounded-2xl p-3.5 text-xs sm:text-sm leading-relaxed space-y-1.5 ${
                  msg.role === "user"
                    ? "bg-indigo-600 text-white rounded-br-xs"
                    : "bg-slate-50 text-slate-800 border border-slate-200/80 rounded-bl-xs font-sans"
                }`}
              >
                <div className="whitespace-pre-line leading-relaxed">
                  {msg.text}
                </div>

                <div
                  className={`flex items-center justify-between pt-1 border-t ${
                    msg.role === "user"
                      ? "border-indigo-500/40 text-indigo-200"
                      : "border-slate-200/60 text-slate-400"
                  } text-[10px]`}
                >
                  <span>{msg.timestamp}</span>
                  {msg.role === "model" && (
                    <button
                      type="button"
                      onClick={() => handleSpeakText(msg.text)}
                      className="flex items-center gap-1 text-purple-600 hover:text-purple-800 font-semibold cursor-pointer"
                      title="朗读英语例句/重点"
                    >
                      <Volume2 className="w-3 h-3" />
                      <span>听原声例句</span>
                    </button>
                  )}
                </div>
              </div>

              {msg.role === "user" && (
                <div className="w-7 h-7 rounded-lg bg-indigo-100 text-indigo-700 flex items-center justify-center shrink-0 mt-0.5">
                  <User className="w-4 h-4" />
                </div>
              )}
            </div>
          ))}

          {isLoading && (
            <div className="flex gap-2.5 items-start">
              <div className="w-7 h-7 rounded-lg bg-purple-600 text-white flex items-center justify-center shrink-0">
                <Bot className="w-4 h-4" />
              </div>
              <div className="bg-slate-50 border border-slate-200/80 rounded-2xl p-3 text-xs text-slate-500 flex items-center gap-2">
                <Zap className="w-3.5 h-3.5 text-purple-600 animate-spin" />
                <span>私教导师正在深入解析，马上为您答疑...</span>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>
      )}

      {/* Input Box */}
      <div className="pt-2">
        <div className="flex items-center gap-2">
          <input
            type="text"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                handleSend();
              }
            }}
            placeholder="问问导师：比如'第2段那句话如何翻译？'、'为什么这里是冷知识？'..."
            disabled={isLoading}
            className="flex-1 px-4 py-2.5 rounded-xl border border-slate-200 focus:border-purple-500 focus:ring-2 focus:ring-purple-100 outline-none text-xs sm:text-sm bg-white"
          />

          <button
            type="button"
            onClick={() => handleSend()}
            disabled={isLoading || !inputValue.trim()}
            className="px-4 py-2.5 rounded-xl font-semibold text-white bg-purple-600 hover:bg-purple-700 active:scale-95 transition flex items-center gap-1.5 text-xs sm:text-sm disabled:opacity-40 cursor-pointer shadow-xs"
          >
            <Send className="w-3.5 h-3.5" />
            <span>发送</span>
          </button>
        </div>
      </div>
    </div>
  );
};
