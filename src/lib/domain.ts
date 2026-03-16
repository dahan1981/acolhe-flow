const organizationNames: Record<string, string> = {
  "sec-mulher": "Secretaria da Mulher",
  creas: "CREAS",
  cras: "CRAS",
  delegacia: "Delegacia da Mulher",
  ubs: "UBS",
  defensoria: "Defensoria Publica",
  abrigo: "Casa Abrigo",
};

export function getOrganizationName(code: string | null | undefined) {
  if (!code) {
    return "Nao informado";
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
