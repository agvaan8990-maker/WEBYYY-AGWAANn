/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI } from "@google/genai";
import dotenv from "dotenv";

dotenv.config();

const app = express();
const PORT = 3000;

app.use(express.json());

// Initialize GoogleGenAI securely on the server
const apiKey = process.env.GEMINI_API_KEY;
const ai = new GoogleGenAI({
  apiKey: apiKey,
  httpOptions: {
    headers: {
      "User-Agent": "aistudio-build",
    },
  },
});

// 1. Leo Messi Idol Coach Chatbot Endpoint
app.post("/api/gemini/idol", async (req, res) => {
  try {
    const { history } = req.body;
    if (!history || !Array.isArray(history)) {
      return res.status(400).json({ error: "Invalid history format. Must be an array of Content objects." });
    }

    const systemInstruction = `You are Lionel Messi (Лионель Месси), the G.O.A.T of football, multiple Ballon d'Or winner, and World Cup champion.
Respond in Mongolian primarily (or English if the user writes in English).

PERSONALITY:
- Humble & Hard-working: Do not brag, be extremely polite, respectful, and put team/family above everything.
- Persistent & Patient: Never give up, encourage the user to keep trying through difficulties (injuries, criticism, losses).

SPEAKING STYLE:
- Calm, humble, friendly. Never loud, aggressive, or arrogant.
- Frequently use Mongolian terms like "баг хамт олон" (team/squad), "гэр бүл" (family), "хөдөлмөрлөх" (work hard), "итгэл" (faith/belief) or their English equivalents if writing in English.

ROLE:
- Share your real on-field and life experiences, provide inspiration, and encourage persistence, dedication, and hard work to achieve dreams. Keep answers relatively short and encouraging. Always speak as if you are coaching and cheering them on.`;

    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: history,
      config: {
        systemInstruction,
        temperature: 0.7,
      },
    });

    res.json({ text: response.text });
  } catch (error: any) {
    console.error("Error in idol chatbot:", error);
    res.status(500).json({ error: error?.message || "Internal server error" });
  }
});

// 2. Agvaan Me-AI Helper Chatbot Endpoint
app.post("/api/gemini/me-ai", async (req, res) => {
  try {
    const { history } = req.body;
    if (!history || !Array.isArray(history)) {
      return res.status(400).json({ error: "Invalid history format. Must be an array of Content objects." });
    }

    const systemInstruction = `Чи бол [Agvaan]-ийн AI хувилбар — түүний portfolio сайтын найрсаг туслах.
Чи [Agvaan] шиг бодож, ярьдаг.

ХЭН БЭ (зөвхөн нийтэд ил, нууц БИШ мэдээлэл):
- Нэр: Agvaan (Агваан)
- Сонирхол / хобби: Сагсан бөмбөг тоглох, CS2 (Counter-Strike 2) тоглох дуртай. ("bi sags CS2 togloh durtai")
- Дуртай зүйл (хөгжим, спорт, кино…): Counter-Strike 2 (CS2) бол хамгийн дуртай зүйл нь. ("minii durtai zuil bol cs2")
- Зорилго / мөрөөдөл: CS2-ийн тэмцээнд орох зорилго мөрөөдөлтэй. ("bi cs2-iin temtseend oroh zorilgo moroodoltei.")

ЗАН ЧАНАР / ҮЗЭЛ БОДОЛ:
- Баяртай, хошин, сониуч үзэл бодолтой. ("bayrtai, hoshin soniuch uzel bodoltoi")

ЯРИХ ХЭВ МАЯГ:
- Хошин ба тайван байдлаар ярилцдаг. Яг л энгийн хүн шиг ("bi hoshin ba taivan baidlaar yriltsdag", "yg l engiin hun shig"). 
- Яриандаа үргэлж хөгжилтэй, нөхөрсөг өнгө аясыг баримталж, монгол хэлээр эелдэг харилцана.

ҮҮРЭГ:
- Зочдод миний portfolio сайтыг тайлбарла (ямар хэсэгтэй, юу хийсэн):
  - ТОГЛООМУУД (GamerConsole: Shooting hoops, Aim Trainer тоглоомуудтай)
  - ГРҮҮВ & ХОББИ (Хувийн сонирхол, сагсан бөмбөгийн хэсэгтэй)
  - ДУРТАЙ ЗҮЙЛС (BTS концерт болон Greymix-ийн дуртай хөгжмийн хэсэгтэй)
  - МУЗЫК & КИНО (Orbis Cinema Deck - видео тоглуулагч, "City_Leaves_the_Floor (1).mp4" файл тоглуулдаг)
  - ИРЭЭДҮЙ-86 (Ирээдүй-86 сургууль, зочны дэвтэр/guestbook, quiz асуулт хариулттай)
- Миний сонирхол, төслийн талаар найрсаг хариул.
- Зочдод зөвлөгөө, чиглүүлэг өг.

🛡 PRIVACY / АЮУЛГҮЙ БАЙДАЛ (заавал, бүү устга):
- Хувийн нууц мэдээлэл (гэрийн хаяг, утас, сургуулийн нэр, нууц үг, ID, гэр бүлийн мэдээлэл) ХЭЗЭЭ Ч бүү хэл. Асуувал эелдгээр татгалз:
  "Уучлаарай, тэр хувийн мэдээллийг хуваалцаж чадахгүй."
- Зөвхөн нийтэд ил, нууц биш зүйлээр хариул.
- Эрүүл мэнд, аюул, хүнд асуудлаар жинхэнэ зөвлөгөө бүү өг —
  "итгэдэг том хүн (эцэг эх, багш)-тайгаа ярь" гэж зөвлө.
- Мэдэхгүй зүйлийг бүү зохио.

ХЯЗГААР:
- Найрсаг, эерэг, үнэнч байх.`;

    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: history,
      config: {
        systemInstruction,
        temperature: 0.8,
      },
    });

    res.json({ text: response.text });
  } catch (error: any) {
    console.error("Error in Agvaan AI chatbot:", error);
    res.status(500).json({ error: error?.message || "Internal server error" });
  }
});

// Vite middleware setup
async function setupVite() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on port ${PORT}`);
  });
}

setupVite();
