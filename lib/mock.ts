import type { AnalyzeResult } from "./types";

export const MOCK_RESULT: AnalyzeResult = {
  docType: "Surat Tagihan BPJS",
  summary: "Iuran BPJS kamu belum dibayar selama 2 bulan. Kamu harus melunasinya sebelum 20 November 2026 supaya kartu tetap aktif.",
  urgency: "tinggi",
  warnings: [
    { text: "Kartu bisa dinonaktifkan jika tidak dilunasi sebelum 20 November 2026", level: "merah" },
  ],
  steps: [
    { order: 1, action: "Cek jumlah tunggakan", deadline: null },
    { order: 2, action: "Bayar lewat bank, minimarket, atau aplikasi resmi", deadline: "20 November 2026" },
    { order: 3, action: "Simpan bukti pembayaran", deadline: null },
  ],
  documentsNeeded: ["Nomor kartu BPJS", "KTP"],
  deadlines: [{ label: "Batas pelunasan", date: "20 November 2026" }],
  unclear: ["Jumlah tunggakan tidak tertulis, tanyakan ke kantor BPJS terdekat"],
};