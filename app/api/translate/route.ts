import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY!,
});

export async function POST(request: Request) {
  try {
    const { text } = await request.json();

    if (!text || typeof text !== "string") {
      return Response.json(
        { error: "Teks tidak boleh kosong." },
        { status: 400 }
      );
    }

    if (text.length > 10000) {
      return Response.json(
        { error: "Teks maksimal 10.000 karakter." },
        { status: 400 }
      );
    }

    const result = await ai.models.generateContent({
      model: process.env.GEMINI_MODEL || "gemini-2.5-flash",
      contents: `
        Kamu adalah asisten penerjemah bahasa birokrasi.

        Tugas:
        1. Ubah bahasa birokrasi menjadi bahasa Indonesia sederhana.
        2. Pertahankan makna dan informasi asli.
        3. Gunakan kalimat yang jelas dan mudah dipahami.
        4. Jangan mengarang informasi tambahan.
        5. Jika terdapat istilah hukum atau administrasi,
           jelaskan dengan bahasa sederhana.

        Teks yang harus disederhanakan:
        ${text}
      `,
    });

    return Response.json({
      success: true,
      result: result.text,
    });

  } catch (error) {
    console.error("Gemini API Error:", error);

    return Response.json(
      { error: "Gagal memproses teks. Silakan coba lagi." },
      { status: 500 }
    );
  }
}