/**
 * Clean text-to-speech wrapper using Web Speech API
 */

export function speakEnglish(text: string, rate = 0.88): Promise<void> {
  return new Promise((resolve) => {
    if (!text || typeof window === "undefined" || !("speechSynthesis" in window)) {
      resolve();
      return;
    }

    try {
      window.speechSynthesis.cancel();
      // Clean special characters if needed
      const clean = text.replace(/[/\\#+()$~%'":*?<>{}]/g, " ").trim();
      const utterance = new SpeechSynthesisUtterance(clean);
      utterance.lang = "en-US";
      utterance.rate = rate;
      utterance.pitch = 1.0;

      // Prefer native English voices if available
      const voices = window.speechSynthesis.getVoices();
      const enVoice = voices.find(
        (v) => (v.lang.startsWith("en-US") || v.lang.startsWith("en-GB")) && !v.name.includes("whisper")
      );
      if (enVoice) {
        utterance.voice = enVoice;
      }

      utterance.onend = () => resolve();
      utterance.onerror = () => resolve();

      window.speechSynthesis.speak(utterance);
    } catch {
      resolve();
    }
  });
}

export function stopSpeaking() {
  if (typeof window !== "undefined" && "speechSynthesis" in window) {
    window.speechSynthesis.cancel();
  }
}
