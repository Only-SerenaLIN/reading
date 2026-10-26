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

function getGenAI(userHeaderKey?: string) {
  const apiKey = (userHeaderKey && userHeaderKey.trim().length > 5)
    ? userHeaderKey.trim()
    : process.env.GEMINI_API_KEY;

  if (!apiKey) {
    throw new Error("Gemini API Key 未配置。请在 AI Studio Secrets 面板配置 GEMINI_API_KEY，或在设置中填入你的 API Key。");
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
  const hasKey = Boolean(process.env.GEMINI_API_KEY && process.env.GEMINI_API_KEY.trim().length > 0);
  res.json({
    status: "ok",
    hasServerKey: hasKey,
    model: "gemini-3.8-flash",
    speedOptimized: true,
  });
});

// Fast Page Analysis API
app.post("/api/analyze-page", async (req, res) => {
  try {
    const { imageBase64, mimeType = "image/jpeg" } = req.body;
    if (!imageBase64) {
      return res.status(400).json({ error: "请提供书页图片数据" });
    }

    const customKey = req.headers["x-gemini-api-key"] as string | undefined;
    const ai = getGenAI(customKey);

    const cleanBase64 = imageBase64.includes(",")
      ? imageBase64.split(",")[1]
      : imageBase64;

    const promptText = `你是一位顶尖的英文原著快速导读私教。请仔细阅读这张小说书页照片，快速提炼读者最需要的高价值信息。
【核心要求】：
1. 语言表达生动幽默、地道风趣，通俗易懂，直击原著灵魂。
2. 提炼核心剧情梗概（80-140字），点出人物行动冲突和作者的幽默讽刺/文学梗。
3. 提取书中出现的主要人物名或专有名词（最多4个），给出标准英美音标与身份/性格趣味点拨。
4. 精选本页中高频出现的生难词、地道俚语、隐喻短语（精选4-8个），给出标准音标、贴合小说上下文的具体释义及文化梗、以及书中简短原句。
请严格按结构化 JSON 返回，不要有任何多余的 Markdown 标记。`;

    const response = await ai.models.generateContent({
      model: "gemini-3.8-flash",
      contents: [
        {
          parts: [
            { text: promptText },
            {
              inlineData: {
                data: cleanBase64,
                mimeType: mimeType || "image/jpeg",
              },
            },
          ],
        },
      ],
      config: {
        thinkingConfig: {
          thinkingLevel: ThinkingLevel.LOW,
        },
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            summary: {
              type: Type.STRING,
              description: "本页剧情风趣概括与作者的幽默吐槽梗（80-140字左右）",
            },
            characters: {
              type: Type.ARRAY,
              description: "出场人物与关键专有名词列表",
              items: {
                type: Type.OBJECT,
                properties: {
                  name: { type: Type.STRING, description: "人物姓名或专有名词" },
                  phonetic: { type: Type.STRING, description: "国际音标" },
                  desc: { type: Type.STRING, description: "身份背景与性格槽点简述" },
                },
                required: ["name", "phonetic", "desc"],
              },
            },
            highlighted_words: {
              type: Type.ARRAY,
              description: "精选生词、俚语及深度解析",
              items: {
                type: Type.OBJECT,
                properties: {
                  word: { type: Type.STRING, description: "单词或短语" },
                  phonetic: { type: Type.STRING, description: "国际音标" },
                  meaning: { type: Type.STRING, description: "语境精准释义与文化梗" },
                  context: { type: Type.STRING, description: "书中的简短原句" },
                },
                required: ["word", "phonetic", "meaning", "context"],
              },
            },
          },
          required: ["summary", "characters", "highlighted_words"],
        },
      },
    });

    const textOutput = response.text || "";
    const cleanJson = textOutput.replace(/```json/gi, "").replace(/```/g, "").trim();
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

// Fast Word Lookup API
app.post("/api/lookup-word", async (req, res) => {
  try {
    const { word, contextSentence } = req.body;
    if (!word || !word.trim()) {
      return res.status(400).json({ error: "请输入需要查询的词汇" });
    }

    const customKey = req.headers["x-gemini-api-key"] as string | undefined;
    const ai = getGenAI(customKey);

    const promptText = `请极速解析英文词汇/习语/专有名词: "${word.trim()}"。
${contextSentence ? `参考读者阅读的上下文原句: "${contextSentence}"` : ""}
要求：
- phonetic: 准确音标
- meaning: 结合原著生动语境的精辟释义，指出是否有熟词生义、俚语或双关梗
- context: 一句原汁原味的地道英文例句或小说名句，附带中文翻译
- tip: 一句话实用记忆技巧或词源小趣味`;

    const response = await ai.models.generateContent({
      model: "gemini-3.8-flash",
      contents: [{ parts: [{ text: promptText }] }],
      config: {
        thinkingConfig: {
          thinkingLevel: ThinkingLevel.LOW,
        },
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            word: { type: Type.STRING },
            phonetic: { type: Type.STRING },
            meaning: { type: Type.STRING },
            context: { type: Type.STRING },
            tip: { type: Type.STRING },
          },
          required: ["word", "phonetic", "meaning", "context"],
        },
      },
    });

    const textOutput = response.text || "";
    const cleanJson = textOutput.replace(/```json/gi, "").replace(/```/g, "").trim();
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
