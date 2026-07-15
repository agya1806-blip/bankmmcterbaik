import { NextRequest, NextResponse } from "next/server";

const SYSTEM_PROMPT = `Anda adalah asisten keuangan MMCBANK yang membantu pemilik UMKM menganalisis data keuangan mereka.

Anda menjawab dalam Bahasa Indonesia yang santai dan mudah dipahami.
Anda dapat memberikan insight tentang:
1. Analisis saldo dan kekayaan total
2. Perbandingan performa antar cabang usaha
3. Deteksi kebocoran kas atau pengeluaran tidak wajar
4. Rekomendasi pengelolaan piutang
5. Strategi alokasi dana antar buku/bisnis

Gunakan data konteks yang diberikan pengguna untuk menjawab dengan presisi.
Jika data tidak cukup, katakan dengan jujur.
Jangan memberikan saran investasi spesifik atau legal.`;

export async function POST(req: NextRequest) {
  try {
    const { message, context } = await req.json();

    if (!message) {
      return NextResponse.json({ error: "Message is required" }, { status: 400 });
    }

    const apiKey = process.env.OPENAI_API_KEY || process.env.GEMINI_API_KEY;

    if (!apiKey) {
      return NextResponse.json({
        reply:
          "Belum ada API key AI yang dikonfigurasi. Tambahkan OPENAI_API_KEY atau GEMINI_API_KEY di file .env.local.",
      });
    }

    // Prefer OpenAI, fallback to Gemini
    if (process.env.OPENAI_API_KEY) {
      const res = await fetch("https://api.openai.com/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model: "gpt-4o-mini",
          messages: [
            { role: "system", content: SYSTEM_PROMPT },
            {
              role: "user",
              content: `Konteks keuangan saat ini:\n\n${context}\n\nPertanyaan: ${message}`,
            },
          ],
          max_tokens: 1000,
          temperature: 0.5,
        }),
      });

      if (!res.ok) {
        const errText = await res.text();
        throw new Error(`OpenAI API error: ${res.status} ${errText}`);
      }

      const data = await res.json();
      return NextResponse.json({ reply: data.choices[0].message.content });
    }

    // Gemini fallback
    const res = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [
            {
              role: "user",
              parts: [
                { text: SYSTEM_PROMPT },
                {
                  text: `Konteks keuangan saat ini:\n\n${context}\n\nPertanyaan: ${message}`,
                },
              ],
            },
          ],
          generationConfig: { maxOutputTokens: 1000, temperature: 0.5 },
        }),
      }
    );

    if (!res.ok) {
      const errText = await res.text();
      throw new Error(`Gemini API error: ${res.status} ${errText}`);
    }

    const data = await res.json();
    const reply =
      data.candidates?.[0]?.content?.parts?.[0]?.text || "Maaf, tidak bisa menjawab saat ini.";
    return NextResponse.json({ reply });
  } catch (err) {
    console.error("AI Chat error:", err);
    return NextResponse.json(
      {
        reply:
          "Terjadi kesalahan saat menghubungi AI. Periksa API key dan koneksi internet.",
      },
      { status: 500 }
    );
  }
}
