export type AnalyzeResult = {
  docType: string;                       // contoh: "Surat Tagihan BPJS"
  summary: string;                       // maksimal 5 kalimat, bahasa sederhana
  urgency: "rendah" | "sedang" | "tinggi";
  warnings: { text: string; level: "merah" | "kuning" }[];
  steps: { order: number; action: string; deadline: string | null }[];
  documentsNeeded: string[];
  deadlines: { label: string; date: string }[];
  unclear: string[];                     // bagian yang tidak jelas di dokumen
};

export type AnalyzeError = { error: string };
