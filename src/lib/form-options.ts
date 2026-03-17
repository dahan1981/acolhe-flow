import type { Ethnicity, RiskLevel, ViolenceType } from "@/types/domain";
import { ethnicityLabel, violenceTypeLabel } from "@/lib/domain";

export const riskOptions: Array<{ value: RiskLevel; label: string }> = [
  { value: "baixo", label: "Baixo" },
  { value: "medio", label: "Medio" },
  { value: "alto", label: "Alto" },
  { value: "critico", label: "Critico" },
];

export const violenceTypeOptions: Array<{ value: ViolenceType; label: string }> = [
  "violencia_patrimonial",
  "violencia_sexual",
  "violencia_fisica",
  "violencia_moral",
  "violencia_psicologica",
].map((value) => ({
  value,
  label: violenceTypeLabel(value),
}));

export const ethnicityOptions: Array<{ value: Ethnicity; label: string }> = [
  "branca",
  "preta",
  "parda",
  "amarela",
  "indigena",
  "nao_informada",
].map((value) => ({
  value,
  label: ethnicityLabel(value),
}));
