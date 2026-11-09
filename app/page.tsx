"use client";

import { useState } from "react";
import type { ReactNode } from "react";
import type { AnalyzeResult } from "@/lib/types";
import { SAMPLES } from "@/lib/samples";
import { MOCK_RESULT } from "@/lib/mock";

/* true = pakai data tiruan, false = pakai API asli */
const PAKAI_MOCK = false;

type Status = "input" | "loading" | "hasil";

const TINGKAT_URGENSI: Record<
  AnalyzeResult["urgency"],
  { ikon: string; kelas: string }
> = {
  tinggi: { ikon: "🔴", kelas: "text-red-600" },
  sedang: { ikon: "🟡", kelas: "text-yellow-600" },
  rendah: { ikon: "🟢", kelas: "text-green-600" },
};

async function analyzeText(text: string): Promise<AnalyzeResult> {
  const res = await fetch("/api/analyze", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ text }),
  });

  const data = await res.json();

  if (!res.ok) {
    throw new Error(data.error || "Terjadi kesalahan. Coba lagi ya.");
  }

  const raw = data.result ?? data;
  const urgency = String(raw?.urgency).toLowerCase();

  if (
    !raw ||
    typeof raw.docType !== "string" ||
    typeof raw.summary !== "string" ||
    !(urgency in TINGKAT_URGENSI) ||
    !Array.isArray(raw.warnings) ||
    !Array.isArray(raw.steps) ||
    !Array.isArray(raw.documentsNeeded) ||
    !Array.isArray(raw.unclear)
  ) {
    throw new Error("Format jawaban dari server tidak sesuai.");
  }

  return { ...raw, urgency } as AnalyzeResult;
}

function Kartu({ judul, children }: { judul: string; children: ReactNode }) {
  return (
    <section className="border-b border-gray-200 py-4">
      <h2 className="mb-2 text-sm font-bold tracking-wide text-gray-500">
        {judul}
      </h2>
      {children}
    </section>
  );
}

export default function Home() {
  const [status, setStatus] = useState<Status>("input");
  const [teks, setTeks] = useState("");
  const [hasil, setHasil] = useState<AnalyzeResult | null>(null);
  const [selesai, setSelesai] = useState<number[]>([]);
  const [tersalin, setTersalin] = useState(false);
  const [error, setError] = useState("");

  async function handleJelaskan() {
    setError("");
    setStatus("loading");

    try {
      const hasilBaru = PAKAI_MOCK ? MOCK_RESULT : await analyzeText(teks);
      setHasil(hasilBaru);
      setSelesai([]);
      setStatus("hasil");
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Terjadi kesalahan. Coba lagi ya."
      );
      setStatus("input");
    }
  }

  function handleBaru() {
    setTeks("");
    setHasil(null);
    setError("");
    setStatus("input");
  }

  function toggleLangkah(i: number) {
    setSelesai((prev) =>
      prev.includes(i) ? prev.filter((x) => x !== i) : [...prev, i]
    );
  }

  function handleDengarkan() {
    if (!hasil) return;
    window.speechSynthesis.cancel();
    const suara = new SpeechSynthesisUtterance(hasil.summary);
    suara.lang = "id-ID";
    suara.rate = 0.9;
    window.speechSynthesis.speak(suara);
  }

  async function handleSalin() {
    if (!hasil) return;
    const isi =
      `${hasil.docType}\n\n${hasil.summary}\n\nYang harus dilakukan:\n` +
      hasil.steps.map((s) => `${s.order}. ${s.action}`).join("\n");
    await navigator.clipboard.writeText(isi);
    setTersalin(true);
    setTimeout(() => setTersalin(false), 2000);
  }

  /* Layar 2: Memuat */
  if (status === "loading") {
    return (
      <main className="mx-auto flex min-h-screen max-w-xl flex-col items-center justify-center bg-white p-4 text-center text-gray-900">
        <div className="h-12 w-12 animate-spin rounded-full border-4 border-gray-200 border-t-blue-700" />
        <p className="mt-6 text-lg font-semibold">
          Sedang membaca dokumen kamu...
        </p>
        <p className="mt-1 text-base text-gray-500">
          Biasanya sekitar 5-10 detik.
        </p>
      </main>
    );
  }

  /* Layar 3: Hasil */
  if (status === "hasil" && hasil) {
    const urgensi = TINGKAT_URGENSI[hasil.urgency];

    return (
      <main className="mx-auto min-h-screen max-w-xl bg-white p-4 text-base text-gray-900">
        <div className="flex items-center justify-between">
          <button onClick={handleBaru} className="py-2 text-blue-700">
            ← Dokumen baru
          </button>
          <button onClick={handleDengarkan} className="py-2 text-blue-700">
            🔊 Dengarkan
          </button>
        </div>

        <section className="border-b border-gray-200 py-4">
          <p className="text-lg font-semibold">📌 Jenis: {hasil.docType}</p>
          <p className="mt-1">
            Urgensi:{" "}
            <span className={`font-bold ${urgensi.kelas}`}>
              {urgensi.ikon} {hasil.urgency.toUpperCase()}
            </span>
          </p>
        </section>

        <Kartu judul="💬 INTINYA">
          <p>{hasil.summary}</p>
        </Kartu>

        {hasil.warnings.length > 0 && (
          <Kartu judul="🔴 PERHATIAN">
            <ul className="space-y-2">
              {hasil.warnings.map((w) => (
                <li
                  key={w.text}
                  className={`rounded-lg p-3 ${
                    w.level === "merah"
                      ? "bg-red-50 text-red-700"
                      : "bg-yellow-50 text-yellow-800"
                  }`}
                >
                  {w.level === "merah" ? "🔴" : "🟡"} {w.text}
                </li>
              ))}
            </ul>
          </Kartu>
        )}

        <Kartu judul="✅ YANG HARUS DILAKUKAN">
          <ul className="space-y-3">
            {hasil.steps.map((s, i) => (
              <li key={s.order}>
                <label className="flex items-start gap-3">
                  <input
                    type="checkbox"
                    checked={selesai.includes(i)}
                    onChange={() => toggleLangkah(i)}
                    className="mt-1 h-5 w-5"
                  />
                  <span
                    className={
                      selesai.includes(i)
                        ? "text-green-700 line-through"
                        : ""
                    }
                  >
                    {s.order}. {s.action}
                  </span>
                </label>
                {s.deadline && (
                  <p className="ml-8 text-sm text-red-600">⏰ {s.deadline}</p>
                )}
              </li>
            ))}
          </ul>
        </Kartu>

        {hasil.documentsNeeded.length > 0 && (
          <Kartu judul="📎 SIAPKAN">
            <ul className="list-disc space-y-1 pl-5">
              {hasil.documentsNeeded.map((d) => (
                <li key={d}>{d}</li>
              ))}
            </ul>
          </Kartu>
        )}

        {hasil.unclear.length > 0 && (
          <Kartu judul="❓ KURANG JELAS">
            <ul className="list-disc space-y-1 pl-5">
              {hasil.unclear.map((u) => (
                <li key={u}>{u}</li>
              ))}
            </ul>
          </Kartu>
        )}

        <div className="mt-4 flex gap-2">
          <button
            onClick={handleSalin}
            className="h-12 flex-1 rounded-lg border border-gray-300 font-semibold"
          >
            {tersalin ? "Tersalin ✓" : "Salin hasil"}
          </button>
          <button
            onClick={handleBaru}
            className="h-12 flex-1 rounded-lg bg-blue-700 font-semibold text-white"
          >
            Dokumen baru
          </button>
        </div>

        <p className="mt-4 text-sm text-gray-500">
          ⚠ Penjelasan dibuat oleh AI dan bukan pengganti informasi resmi.
        </p>
      </main>
    );
  }

  /* Layar 1: Input */
  return (
    <main className="mx-auto min-h-screen max-w-xl bg-white p-4 text-base text-gray-900">
      <h1 className="text-2xl font-bold">📄 Penerjemah Bahasa Birokrasi</h1>
      <p className="mt-1 text-gray-600">
        Tempel surat resmi, kami jelaskan dengan bahasa yang mudah.
      </p>

      <textarea
        value={teks}
        onChange={(e) => setTeks(e.target.value)}
        placeholder="Tempel teks dokumen di sini..."
        className="mt-4 h-56 w-full rounded-lg border border-gray-300 p-3 text-base text-gray-900 placeholder:text-gray-500"
      />

      <p className="mt-4 text-gray-600">Coba contoh:</p>
      <div className="mt-2 flex flex-wrap gap-2">
        {SAMPLES.map((c) => (
          <button
            key={c.label}
            onClick={() => setTeks(c.text)}
            className="rounded-full border border-gray-300 px-4 py-2"
          >
            {c.label}
          </button>
        ))}
      </div>

      <button
        disabled
        className="mt-4 h-12 w-full rounded-lg border border-dashed border-gray-300 text-gray-400"
      >
        📷 Foto dokumen (segera hadir)
      </button>

      {error && (
        <p className="mt-4 rounded-lg bg-red-50 p-3 text-red-700">⚠ {error}</p>
      )}

      <button
        onClick={handleJelaskan}
        disabled={teks.trim() === ""}
        className="mt-4 h-12 w-full rounded-lg bg-blue-700 font-semibold text-white disabled:bg-gray-300"
      >
        Jelaskan Dokumen Ini
      </button>

      <p className="mt-4 text-sm text-gray-500">
        ⚠ Penjelasan dibuat oleh AI dan bukan pengganti informasi resmi.
      </p>
    </main>
  );
}