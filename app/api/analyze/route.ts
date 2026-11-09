
import { GoogleGenAI } from "@google/genai";
import { NextResponse } from "next/server";
import { SYSTEM_PROMPT } from "@/lib/prompt";

const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY!,
});

export async function POST(req: Request) {
  try {
    const { text, imageBase64, mediaType } = await req.json();

    // Validasi input
    if (!imageBase64 && (!text || text.trim().length < 20)) {
      return NextResponse.json(
        { error: "Teks dokumen terlalu pendek. Tempel isi surat dulu ya." },
        { status: 400 }
      );
    }

    const parts: any[] = [];

    // Jika terdapat gambar
    if (imageBase64) {
      parts.push({
        inlineData: {
          mimeType: mediaType || "image/jpeg",
          data: imageBase64,
        },
      });
    }

    // Masukkan teks
    parts.push({
      text: text?.trim() || "Jelaskan dokumen pada gambar ini.",
    });

    // Proses menggunakan Gemini
    const response = await ai.models.generateContent({
      model: process.env.GEMINI_MODEL || "gemini-2.5-flash",
      contents: [
        {
          role: "user",
          parts,
        },
      ],
      config: {
        systemInstruction: SYSTEM_PROMPT,
        maxOutputTokens: 1500,
        responseMimeType: "application/json",
      },
    });

    // Ambil hasil Gemini
const raw = response.text || "";

// Periksa apakah respons Gemini kosong
if (!raw.trim()) {
  throw new Error("Gemini memberikan respons kosong.");
}

// Bersihkan format JSON
const clean = raw.replace(/```json|```/g, "").trim();

let parsed;

try {
  parsed = JSON.parse(clean);
} catch (error) {
  console.error("Invalid Gemini JSON:", raw);
  throw new Error("Format respons Gemini bukan JSON valid.");
}

return NextResponse.json(parsed);

} catch (error) {
  console.error("Gemini API Error:", error);

  return NextResponse.json(
    { error: "Maaf, dokumen belum bisa diproses. Coba lagi ya." },
    { status: 500 }
  );
}
}
