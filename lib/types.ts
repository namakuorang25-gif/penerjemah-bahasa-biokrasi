export type AnalyzeResult = {
  docType: string;
  summary: string;
  urgency: "rendah" | "sedang" | "tinggi";
  warnings: { text: string; level: "merah" | "kuning" }[];
  steps: { order: number; action: string; deadline: string | null }[];
  documentsNeeded: string[];
  deadlines: { label: string; date: string }[];
  unclear: string[];
};