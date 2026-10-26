import express from "express";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";
import { GoogleGenAI, ThinkingLevel, Type } from "@google/genai";

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = Number(process.env.PORT) || 3000;

app.use(express.json({ limit: "30mb" }));
app.use(express.urlencoded({ extended: true, limit: "30mb" }));

// In-memory cache for fast TTS audio replay
const ttsAudioCache = new Map<string, string>();

function getGenAI(userHeaderKey?: string) {
  const apiKey =
    userHeaderKey && userHeaderKey.trim().length > 5
      ? userHeaderKey.trim()
      : process.env.GEMINI_API_KEY;

  if (!apiKey) {
    throw new Error(
      "Gemini API Key 未配置。请在 AI Studio Secrets 面板配置 GEMINI_API_KEY，或在设置中填入你的 API Key。"
    );
  }

  return new GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        "User-Agent": "aistudio-build",
      },
    },
  });
}

// Status check API
app.get("/api/status", (_req, res) => {
  const hasKey = Boolean(
    process.env.GEMINI_API_KEY && process.env.GEMINI_API_KEY.trim().length > 0
  );
  res.json({
    status: "ok",
    hasServerKey: hasKey,
    model: "gemini-3.1-flash-lite",
    ttsModel: "gemini-3.8-flash-lite-tts",
    speedOptimized: true,
  });
});

// Gemini Official System Audio TTS API
app.post("/api/tts", async (req, res) => {
  try {
    const { text, voice = "Zephyr" } = req.body;
    if (!text || !text.trim()) {
      return res.status(400).json({ error: "请提供需要朗读的文本" });
    }

    const cleanText = text.trim().slice(0, 350);
    const cacheKey = `${voice}_${cleanText}`;
    if (ttsAudioCache.has(cacheKey)) {
      return res.json({ audioUrl: ttsAudioCache.get(cacheKey), cached: true });
    }

    const customKey = req.headers["x-gemini-api-key"] as string | undefined;
    const ai = getGenAI(customKey);

    const response = await ai.models.generateContent({
      model: "gemini-3.8-flash-lite-tts",
      contents: [
        {
          role: "user",
          parts: [
            {
              text: cleanText,
              speechMetadata: {
                style: "Authentic, clear native American English novel reading accent, expressive and articulate",
              },
            },
          ],
        },
      ],
      config: {
        responseModalities: ["AUDIO"],
        speechConfig: {
          voiceConfig: {
            prebuiltVoiceConfig: { voiceName: voice || "Zephyr" },
          },
        },
      },
    });

    const base64Audio =
      response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
    if (!base64Audio) {
      throw new Error("Gemini TTS 未返回有效音频流");
    }

    const audioUrl = `data:audio/wav;base64,${base64Audio}`;
    ttsAudioCache.set(cacheKey, audioUrl);
    if (ttsAudioCache.size > 250) {
      const firstKey = ttsAudioCache.keys().next().value;
      if (firstKey) ttsAudioCache.delete(firstKey);
    }

    return res.json({ audioUrl, voice, cached: false });
  } catch (err: any) {
    console.error("Gemini TTS generation error:", err);
    return res.status(500).json({
      error: err?.message || "Gemini 系统声音合成失败",
    });
  }
});

// Section-by-Section Novel Guide Breakdown API (Supports 1 or multiple photos)
app.post("/api/analyze-page", async (req, res) => {
  try {
    const { imageBase64, mimeType = "image/jpeg", images } = req.body;

    // Normalize images list (supports both single image and multiple images)
    const imagesList: { base64: string; mimeType: string }[] = [];
    if (Array.isArray(images) && images.length > 0) {
      images.forEach((img: any) => {
        if (img && (img.base64 || img.imageBase64)) {
          imagesList.push({
            base64: img.base64 || img.imageBase64,
            mimeType: img.mimeType || "image/jpeg",
          });
        }
      });
    } else if (imageBase64) {
      imagesList.push({ base64: imageBase64, mimeType });
    }

    if (imagesList.length === 0) {
      return res.status(400).json({ error: "请提供至少一张书页图片数据" });
    }

    const customKey = req.headers["x-gemini-api-key"] as string | undefined;
    const ai = getGenAI(customKey);

    const isMultiple = imagesList.length > 1;
    const promptText = `你是一位充满热情、风趣幽默的英文原著私教导师。读者在书上做了非常棒的标注与划线。
${
  isMultiple
    ? `读者连续上传了 ${imagesList.length} 张小说书页照片（按前后顺序排列）。请顺应跨页情节的自然推进，进行连贯的逐段拆解与深度导读。`
    : `请观察这张小说书页照片，以极度亲切生动、一段一段拆解的方式输出深度导读：`
}
1. cheer_intro: 热情赞美读者做出的划线标注，指出这${
      isMultiple ? "几" : ""
    }页的语言风格（如地道美式口语/幽默感/理科梗等），引导读者一起按段落拆解重点词汇和情节。
2. sections: 严格按书页由上至下的段落推进分为 2~4 个部分（如“章节标题：...”、“第一、二段：...”、“第三段：...”、“第四段：...”等）：
   - section_title: 该段的情节趣味标题（例如“第一、二段：居里夫妇的‘硬核’浪漫”或“第三段：Womp womp”）
   - section_story: 该段的剧情趣味解读，点出人物身份性格与情境反转
   - terms: 该段落中重点划线词汇或精彩俚语短语列表：
      - term: 词汇或短语名称（附中文简释，如 "hooked her up: 撮合、牵线搭桥"）
      - phonetic: 国际音标
      - tag: 属性标签（如“高频俚语”、“实用口语短语”、“拟声流行语”、“理科幽默”、“反转神句”）
      - explanation: 深入浅出的语境精髓、为什么作者用这个词、文化梗或吐槽背景说明
      - context: 对应的小说原句
3. reading_summary: 阅读小结。提炼主角人设性格（如热爱科学的学霸nerd、会用网络俚语吐槽的现代青年），赞赏读者划线抓得准，并给出原著阅读节奏鼓励。
严格按结构化 JSON 返回，生动鲜活，富有感染力！`;

    const parts: any[] = [{ text: promptText }];
    imagesList.forEach((img) => {
      const clean = img.base64.includes(",")
        ? img.base64.split(",")[1]
        : img.base64;
      parts.push({
        inlineData: {
          data: clean,
          mimeType: img.mimeType || "image/jpeg",
        },
      });
    });

    const contents = [{ parts }];

    const schemaConfig = {
      systemInstruction:
        "你是一位热情风趣的英文原著私教导师。必须以生动、有梗、极其贴合原著小说的口吻输出一段一段的结构化深度导读，让读者越读越上头。",
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          cheer_intro: {
            type: Type.STRING,
            description: "导师开场白（热情鼓励读者在书上的标注与阅读品味）",
          },
          sections: {
            type: Type.ARRAY,
            description: "按段落次序展开的情节与划线词汇拆解",
            items: {
              type: Type.OBJECT,
              properties: {
                section_title: {
                  type: Type.STRING,
                  description:
                    "该段情节趣味标题（如 章节标题：... / 第一、二段：...）",
                },
                section_story: {
                  type: Type.STRING,
                  description: "该段情节背景与人物吐槽趣解",
                },
                terms: {
                  type: Type.ARRAY,
                  description: "该段中的重点词汇、俚语或划线短语",
                  items: {
                    type: Type.OBJECT,
                    properties: {
                      term: {
                        type: Type.STRING,
                        description: "词汇/短语名及简释",
                      },
                      phonetic: { type: Type.STRING, description: "音标" },
                      tag: { type: Type.STRING, description: "属性标签" },
                      explanation: {
                        type: Type.STRING,
                        description:
                          "深入浅出的语境精髓、文化梗、生活实用意图",
                      },
                      context: { type: Type.STRING, description: "书中原句" },
                    },
                    required: ["term", "explanation"],
                  },
                },
              },
              required: ["section_title", "terms"],
            },
          },
          reading_summary: {
            type: Type.STRING,
            description:
              "阅读小结（人设性格提炼、肯定读者抓词精准度、鼓励阅读节奏）",
          },
        },
        required: ["cheer_intro", "sections", "reading_summary"],
      },
    };

    let response;
    try {
      response = await ai.models.generateContent({
        model: "gemini-3.1-flash-lite",
        contents,
        config: schemaConfig,
      });
    } catch (liteErr: any) {
      console.warn(
        "Flash-lite unavailable, using gemini-3.8-flash fallback:",
        liteErr?.message
      );
      response = await ai.models.generateContent({
        model: "gemini-3.8-flash",
        contents,
        config: {
          ...schemaConfig,
          thinkingConfig: { thinkingLevel: ThinkingLevel.LOW },
        },
      });
    }

    const textOutput = response.text || "";
    const cleanJson = textOutput
      .replace(/```json/gi, "")
      .replace(/```/g, "")
      .trim();
    const parsedData = JSON.parse(cleanJson);

    return res.json({
      success: true,
      data: parsedData,
    });
  } catch (error: any) {
    console.error("Analyze page error:", error);
    return res.status(500).json({
      error: error?.message || "导读解析失败，请检查图片清晰度或重试",
    });
  }
});

// "Ask Gemini" Reading Companion Q&A API
app.post("/api/ask-companion", async (req, res) => {
  try {
    const { question, contextGuide, history = [] } = req.body;
    if (!question || !question.trim()) {
      return res.status(400).json({ error: "请输入您想提问的内容" });
    }

    const customKey = req.headers["x-gemini-api-key"] as string | undefined;
    const ai = getGenAI(customKey);

    const systemInstruction = `你是一位知识极度渊博、风趣幽默的英文原著私教导师。
读者正在阅读英文小说，并基于当前导读内容向你请教问题进行查漏补缺。
【当前书页导读背景】：
${contextGuide || "读者正在阅读经典原著小说书页。"}

【你的回答准则】：
1. 语言亲切生动、像老朋友面对面交流，解释深入浅出，彻底讲透生词俚语、长难句语法结构、隐喻伏笔或西方文化双关梗。
2. 遇到英文单词或短语时，标准格式标注英文原词，并给出地道生活例句。
3. 结构清晰，分点回答，重点突出，解答读者的疑惑，帮助读者更有信心地读懂全书。`;

    // Format chat contents
    const contents: any[] = [];
    if (Array.isArray(history) && history.length > 0) {
      history.slice(-6).forEach((h: any) => {
        contents.push({
          role: h.role === "user" ? "user" : "model",
          parts: [{ text: h.text }],
        });
      });
    }
    contents.push({
      role: "user",
      parts: [{ text: question.trim() }],
    });

    let response;
    try {
      response = await ai.models.generateContent({
        model: "gemini-3.1-flash-lite",
        contents,
        config: {
          systemInstruction,
        },
      });
    } catch (liteErr: any) {
      console.warn("Flash-lite companion fallback:", liteErr?.message);
      response = await ai.models.generateContent({
        model: "gemini-3.8-flash",
        contents,
        config: {
          systemInstruction,
          thinkingConfig: { thinkingLevel: ThinkingLevel.LOW },
        },
      });
    }

    const answer = response.text || "导师正在思考中，请稍后再试。";
    return res.json({ success: true, answer });
  } catch (err: any) {
    console.error("Ask companion error:", err);
    return res.status(500).json({
      error: err?.message || "咨询导师失败，请重试",
    });
  }
});

// Fast Word Lookup API
app.post("/api/lookup-word", async (req, res) => {
  try {
    const { word, contextSentence } = req.body;
    if (!word || !word.trim()) {
      return res.status(400).json({ error: "请输入需要查询的词汇" });
    }

    const customKey = req.headers["x-gemini-api-key"] as string | undefined;
    const ai = getGenAI(customKey);

    const promptText = `请以生动有梗的原著私教口吻，解析英文词汇/俚语: "${word.trim()}"。
${contextSentence ? `读者阅读的原文句子: "${contextSentence}"` : ""}
要求：
- phonetic: 准确音标
- tag: 标签（如高频俚语、地道短语、理科幽默、网络流行语）
- meaning: 结合原著生动语境的精辟释义与梗
- context: 一句原汁原味的极地道英文例句及中文翻译
- tip: 一句话超接地气的速记秘诀或词源小趣味`;

    const schemaConfig = {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          word: { type: Type.STRING },
          phonetic: { type: Type.STRING },
          tag: { type: Type.STRING },
          meaning: { type: Type.STRING },
          context: { type: Type.STRING },
          tip: { type: Type.STRING },
        },
        required: ["word", "phonetic", "meaning", "context"],
      },
    };

    let response;
    try {
      response = await ai.models.generateContent({
        model: "gemini-3.1-flash-lite",
        contents: [{ parts: [{ text: promptText }] }],
        config: schemaConfig,
      });
    } catch (liteErr: any) {
      console.warn(
        "Flash-lite unavailable for lookup, using gemini-3.8-flash fallback:",
        liteErr?.message
      );
      response = await ai.models.generateContent({
        model: "gemini-3.8-flash",
        contents: [{ parts: [{ text: promptText }] }],
        config: {
          ...schemaConfig,
          thinkingConfig: { thinkingLevel: ThinkingLevel.LOW },
        },
      });
    }

    const textOutput = response.text || "";
    const cleanJson = textOutput
      .replace(/```json/gi, "")
      .replace(/```/g, "")
      .trim();
    const parsedData = JSON.parse(cleanJson);

    return res.json({
      success: true,
      data: parsedData,
    });
  } catch (error: any) {
    console.error("Lookup word error:", error);
    return res.status(500).json({
      error: error?.message || "生词查询失败，请重试",
    });
  }
});

// Setup Vite or static serving
async function setupServer() {
  const isProd = process.env.NODE_ENV === "production";

  if (!isProd) {
    const { createServer: createViteServer } = await import("vite");
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.resolve(__dirname, "dist")));
    app.get("*", (_req, res) => {
      res.sendFile(path.resolve(__dirname, "dist", "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`🚀 [Pro Reader] Server running on http://0.0.0.0:${PORT}`);
  });
}

setupServer().catch((err) => {
  console.error("Server initialization error:", err);
});
