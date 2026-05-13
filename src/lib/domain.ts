import type { Ethnicity, ViolenceType } from "@/types/domain";

const organizationNames: Record<string, string> = {
  "sec-mulher": "Secretaria da Mulher",
  creas: "CREAS",
  cras: "CRAS",
  delegacia: "Delegacia da Mulher",
  ubs: "UBS",
  defensoria: "Defensoria Pública",
  abrigo: "Casa Abrigo",
};

export function getOrganizationName(code: string | null | undefined) {
  if (!code) {
    return "Não informado";
  }

  return organizationNames[code] ?? code;
}

export function formatDate(dateStr: string) {
  const date = new Date(`${dateStr}T12:00:00`);
  return date.toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

export function formatDateLong(dateStr: string) {
  const date = new Date(`${dateStr}T12:00:00`);
  return date.toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });
}

export function profileLabel(profile: string) {
  if (profile === "mulher") return "Acolhida";
  if (profile === "profissional") return "Profissional";
  return "Gestora";
}

export function violenceTypeLabel(type: ViolenceType) {
  const labels: Record<ViolenceType, string> = {
    violencia_patrimonial: "Violência patrimonial",
    violencia_sexual: "Violência sexual",
    violencia_fisica: "Violência física",
    violencia_moral: "Violência moral",
    violencia_psicologica: "Violência psicológica",
  };

  return labels[type];
}

export function ethnicityLabel(value: Ethnicity) {
  const labels: Record<Ethnicity, string> = {
    branca: "Branca",
    preta: "Preta",
    parda: "Parda",
    amarela: "Amarela",
    indigena: "Indígena",
    nao_informada: "Não informada",
  };

  return labels[value];
}
