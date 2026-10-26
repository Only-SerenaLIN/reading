/**
 * Gemini Official System Voice (gemini-3.8-flash-lite-tts) audio player
 */

import { GeminiVoiceName } from "../types";
import { speakEnglish } from "./speech";

let currentAudio: HTMLAudioElement | null = null;
const clientAudioCache = new Map<string, string>();

export async function playGeminiTTS(
  text: string,
  voice: GeminiVoiceName = "Zephyr",
  apiKey?: string,
  onPlayStateChange?: (isPlaying: boolean) => void
): Promise<void> {
  if (!text || !text.trim()) return;

  const cleanText = text.trim();
  const cacheKey = `${voice}_${cleanText}`;

  // Stop currently playing audio
  if (currentAudio) {
    try {
      currentAudio.pause();
      currentAudio.currentTime = 0;
    } catch {}
    currentAudio = null;
  }

  try {
    let audioUrl = clientAudioCache.get(cacheKey);

    if (!audioUrl) {
      const headers: Record<string, string> = {
        "Content-Type": "application/json",
      };
      if (apiKey && apiKey.trim()) {
        headers["x-gemini-api-key"] = apiKey.trim();
      }

      const res = await fetch("/api/tts", {
        method: "POST",
        headers,
        body: JSON.stringify({
          text: cleanText,
          voice,
        }),
      });

      if (!res.ok) {
        throw new Error(`TTS 请求返回 ${res.status}`);
      }

      const data = await res.json();
      if (!data.audioUrl) {
        throw new Error("TTS 未提供音频数据");
      }
      audioUrl = data.audioUrl;
      clientAudioCache.set(cacheKey, audioUrl as string);
    }

    if (onPlayStateChange) onPlayStateChange(true);

    const audio = new Audio(audioUrl);
    currentAudio = audio;

    return new Promise((resolve) => {
      audio.onended = () => {
        if (currentAudio === audio) currentAudio = null;
        if (onPlayStateChange) onPlayStateChange(false);
        resolve();
      };
      audio.onerror = () => {
        if (currentAudio === audio) currentAudio = null;
        if (onPlayStateChange) onPlayStateChange(false);
        // Fallback to Web Speech API if audio decode fails
        speakEnglish(cleanText).then(resolve);
      };

      audio.play().catch(() => {
        if (onPlayStateChange) onPlayStateChange(false);
        speakEnglish(cleanText).then(resolve);
      });
    });
  } catch (err) {
    console.warn("Gemini TTS fallback to Web Speech API:", err);
    if (onPlayStateChange) onPlayStateChange(false);
    return speakEnglish(cleanText);
  }
}

export function stopGeminiTTS() {
  if (currentAudio) {
    try {
      currentAudio.pause();
      currentAudio.currentTime = 0;
    } catch {}
    currentAudio = null;
  }
}
