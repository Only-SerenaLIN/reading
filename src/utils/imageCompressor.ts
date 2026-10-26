/**
 * High performance client-side image compression & sample book generator
 */

export interface CompressionResult {
  dataUrl: string;
  base64: string;
  mimeType: string;
  originalSizeKb: number;
  compressedSizeKb: number;
  width: number;
  height: number;
  compressionRatio: number;
}

export async function compressImage(
  file: File,
  maxDimension = 840,
  quality = 0.78
): Promise<CompressionResult> {
  const originalSizeKb = Math.round(file.size / 1024);

  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error("读取图片文件失败"));
    reader.onload = (e) => {
      const img = new Image();
      img.onerror = () => reject(new Error("图片解码失败，请确认文件格式"));
      img.onload = () => {
        let w = img.naturalWidth || img.width;
        let h = img.naturalHeight || img.height;

        // Auto-scale to max dimension while preserving aspect ratio
        if (w > maxDimension || h > maxDimension) {
          if (w > h) {
            h = Math.round((h * maxDimension) / w);
            w = maxDimension;
          } else {
            w = Math.round((w * maxDimension) / h);
            h = maxDimension;
          }
        }

        const canvas = document.createElement("canvas");
        canvas.width = w;
        canvas.height = h;
        const ctx = canvas.getContext("2d");

        if (!ctx) {
          reject(new Error("创建画布上下文失败"));
          return;
        }

        // Fill subtle warm white paper background
        ctx.fillStyle = "#ffffff";
        ctx.fillRect(0, 0, w, h);

        // Draw image smoothly
        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = "high";
        ctx.drawImage(img, 0, 0, w, h);

        const mimeType = "image/jpeg";
        const dataUrl = canvas.toDataURL(mimeType, quality);
        const base64 = dataUrl.split(",")[1];
        const compressedSizeKb = Math.round((base64.length * 0.75) / 1024);
        const compressionRatio = originalSizeKb > 0 
          ? Math.round((1 - compressedSizeKb / originalSizeKb) * 100) 
          : 0;

        resolve({
          dataUrl,
          base64,
          mimeType,
          originalSizeKb,
          compressedSizeKb,
          width: w,
          height: h,
          compressionRatio: Math.max(0, compressionRatio),
        });
      };
      img.src = e.target?.result as string;
    };
    reader.readAsDataURL(file);
  });
}

/**
 * Creates an authentic novel page photo simulation on canvas
 */
export function createSampleBookPage(novelId: "love_hypothesis" | "harry_potter" | "gatsby" | "catcher"): {
  title: string;
  author: string;
  dataUrl: string;
  base64: string;
} {
  const canvas = document.createElement("canvas");
  canvas.width = 900;
  canvas.height = 1200;
  const ctx = canvas.getContext("2d")!;

  // Paper texture simulation
  const gradient = ctx.createLinearGradient(0, 0, 900, 1200);
  gradient.addColorStop(0, "#faf6ed");
  gradient.addColorStop(0.5, "#f6f1e5");
  gradient.addColorStop(1, "#eee7d6");
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, 900, 1200);

  // Subtle spine shadow on the left edge
  const spineGrad = ctx.createLinearGradient(0, 0, 80, 0);
  spineGrad.addColorStop(0, "rgba(50, 40, 30, 0.22)");
  spineGrad.addColorStop(0.4, "rgba(50, 40, 30, 0.08)");
  spineGrad.addColorStop(1, "rgba(50, 40, 30, 0)");
  ctx.fillStyle = spineGrad;
  ctx.fillRect(0, 0, 80, 1200);

  // Subtle page vignette
  ctx.strokeStyle = "rgba(180, 160, 140, 0.4)";
  ctx.lineWidth = 1;
  ctx.strokeRect(40, 40, 820, 1120);

  // Content configuration
  let title = "";
  let author = "";
  let headerText = "";
  let pageNumber = "21";
  let lines: { text: string; highlight?: boolean; underline?: boolean }[] = [];

  if (novelId === "love_hypothesis") {
    title = "《假戏真做》居里夫妇与神助攻";
    author = "Ali Hazelwood";
    headerText = "CHAPTER THREE • THE HABENULA: DISAPPOINTMENT";
    pageNumber = "21";
    lines = [
      { text: "My favorite piece of Marie Curie trivia is that she got married in a dark", highlight: true },
      { text: "blue lab dress because it was practical and she could wear it in the lab", highlight: false },
      { text: "afterward. A Polish physicist mutual friend had hooked her up with Pierre,", underline: true },
      { text: "and they flirted over beakers of liquid uranium, but she still reluctantly", underline: true },
      { text: "turned down his initial marriage proposal to return to Poland.", highlight: false },
      { text: "", highlight: false },
      { text: "Womp womp.", highlight: true, underline: true },
      { text: "", highlight: false },
      { text: "Enter Krakow University, which denied her an academic position simply", underline: true },
      { text: "because she was a woman. Total dick move, but very classy, and quite", underline: true },
      { text: "fortunate for modern science, because it drove her right back into Pierre’s", highlight: false },
      { text: "not-yet-radioactive arms.", highlight: true, underline: true },
      { text: "", highlight: false },
      { text: "Now, staring across the crowded biology department hallway, I wondered", highlight: false },
      { text: "if my own habenula was firing at maximum capacity.", highlight: false },
    ];
  } else if (novelId === "harry_potter") {
    title = "《哈利·波特与魔法石》第1章";
    author = "J.K. Rowling";
    headerText = "CHAPTER ONE • THE BOY WHO LIVED";
    pageNumber = "1";
    lines = [
      { text: "Mr. and Mrs. Dursley, of number four, Privet Drive, were proud to say", highlight: false },
      { text: "that they were perfectly normal, thank you very much. They were the", highlight: false },
      { text: "last people you’d expect to be involved in anything strange or", highlight: false },
      { text: "mysterious, because they just didn't hold with such nonsense.", highlight: true },
      { text: "", highlight: false },
      { text: "Mr. Dursley was the director of a firm called Grunnings, which made", highlight: false },
      { text: "drills. He was a big, beefy man with hardly any neck, although he did", highlight: false },
      { text: "have a very large mustache. Mrs. Dursley was thin and blonde and had", highlight: false },
      { text: "nearly twice the usual amount of neck, which came in very useful as she", highlight: false },
      { text: "spent so much of her time craning over garden fences, spying on the", underline: true },
      { text: "neighbors. The Dursleys had a small son called Dudley and in their", highlight: false },
      { text: "opinion there was no finer boy anywhere.", highlight: false },
      { text: "", highlight: false },
      { text: "The Dursleys had everything they wanted, but they also had a secret,", highlight: false },
      { text: "and their greatest fear was that somebody would discover it. They", highlight: false },
      { text: "didn't think they could bear it if anyone found out about the Potters.", highlight: false },
      { text: "Mrs. Potter was Mrs. Dursley’s sister, but they hadn’t met for several", highlight: false },
      { text: "years; in fact, Mrs. Dursley pretended she didn't have a sister, because", highlight: false },
      { text: "her sister and her good-for-nothing husband were as unDursleyish as", underline: true },
      { text: "it was possible to be. The Dursleys shuddered to think what the neighbors", highlight: false },
      { text: "would say if the Potters arrived in the street.", highlight: false },
    ];
  } else if (novelId === "gatsby") {
    title = "《了不起的盖茨比》第1章";
    author = "F. Scott Fitzgerald";
    headerText = "THE GREAT GATSBY • CHAPTER I";
    pageNumber = "1";
    lines = [
      { text: "In my younger and more vulnerable years my father gave me some advice", highlight: true },
      { text: "that I’ve been turning over in my mind ever since.", highlight: false },
      { text: "", highlight: false },
      { text: "“Whenever you feel like criticizing any one,” he told me, “just remember", highlight: false },
      { text: "that all the people in this world haven't had the advantages that you’ve had.”", highlight: false },
      { text: "", highlight: false },
      { text: "He didn’t say any more, but we’ve always been unusually communicative in", highlight: false },
      { text: "a reserved way, and I understood that he meant a great deal more than that.", highlight: false },
      { text: "In consequence, I’m inclined to reserve all judgements, a habit that has", underline: true },
      { text: "opened up many curious natures to me and also made me the victim of", highlight: false },
      { text: "not a few veteran bores. The abnormal mind is quick to detect and attach", highlight: false },
      { text: "itself to this quality when it appears in a normal person, and so it came", highlight: false },
      { text: "about that in college I was unjustly accused of being a politician,", highlight: false },
      { text: "because I was privy to the secret griefs of wild, unknown men.", underline: true },
      { text: "", highlight: false },
      { text: "Reserving judgements is a matter of infinite hope. I am still a little", highlight: false },
      { text: "afraid of missing something if I forget that, as my father snobbishly", highlight: false },
      { text: "suggested, and I snobbishly repeat, a sense of the fundamental decencies", highlight: false },
      { text: "is parcelled out unequally at birth.", highlight: false },
    ];
  } else {
    title = "《麦田里的守望者》第1章";
    author = "J.D. Salinger";
    headerText = "THE CATCHER IN THE RYE • CHAPTER 1";
    pageNumber = "3";
    lines = [
      { text: "If you really want to hear about it, the first thing you’ll probably want", highlight: false },
      { text: "to know is where I was born, and what my lousy childhood was like,", underline: true },
      { text: "and how my parents were occupied and all before they had me, and all", highlight: false },
      { text: "that David Copperfield kind of crap, but I don’t feel like going into", highlight: true },
      { text: "it, if you want to know the truth. In the first place, that stuff bores", highlight: false },
      { text: "me to death, and in the second place, my parents would have about two", highlight: false },
      { text: "hemorrhages apiece if I told anything pretty personal about them.", underline: true },
      { text: "", highlight: false },
      { text: "They're quite touchy about anything like that, especially my father.", highlight: false },
      { text: "They’re nice and all—I'm not saying that—but they’re also touchy as hell.", highlight: false },
      { text: "Besides, I’m not going to tell you my whole goddam autobiography or", highlight: false },
      { text: "anything. I’ll just tell you about this madman stuff that happened to me", highlight: false },
      { text: "around last Christmas before I got pretty run-down and had to come out", highlight: false },
      { text: "here and take it easy.", highlight: false },
    ];
  }

  // Draw Header
  ctx.font = "italic 600 16px 'Georgia', serif";
  ctx.fillStyle = "#6b5e51";
  ctx.textAlign = "center";
  ctx.fillText(headerText, 450, 100);

  ctx.font = "500 15px 'Georgia', serif";
  ctx.fillText(pageNumber, 450, 1140);

  // Draw Lines
  let y = 170;
  const startX = 110;
  ctx.textAlign = "left";

  lines.forEach((item) => {
    if (!item.text) {
      y += 20;
      return;
    }

    ctx.font = "20px 'Georgia', 'Times New Roman', serif";
    const textWidth = ctx.measureText(item.text).width;

    // Simulate yellow highlighter marker
    if (item.highlight) {
      ctx.fillStyle = "rgba(254, 240, 138, 0.65)"; // warm yellow marker
      ctx.fillRect(startX - 4, y - 22, Math.min(textWidth + 8, 700), 28);
    }

    // Draw book text
    ctx.fillStyle = "#1e1b18";
    ctx.fillText(item.text, startX, y);

    // Simulate pen underline
    if (item.underline) {
      ctx.strokeStyle = "rgba(185, 28, 28, 0.75)"; // red ink pen underline
      ctx.lineWidth = 1.8;
      ctx.beginPath();
      ctx.moveTo(startX, y + 4);
      // slightly imperfect hand-drawn jitter
      ctx.quadraticCurveTo(startX + textWidth / 2, y + 6, startX + textWidth, y + 4);
      ctx.stroke();
    }

    y += 38;
  });

  const dataUrl = canvas.toDataURL("image/jpeg", 0.85);
  const base64 = dataUrl.split(",")[1];

  return { title, author, dataUrl, base64 };
}
