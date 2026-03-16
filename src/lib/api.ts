import type {
  CaseDetail,
  CaseStatus,
  CaseSummary,
  CreateAttendancePayload,
  CreateInternalUserPayload,
  CreateReferralPayload,
  CreateSupportRequestPayload,
  LoginPayload,
  ManagerStats,
  Organization,
  ProfessionalDashboardResponse,
  RegisterWomanPayload,
  SessionUser,
  WomanDashboardResponse,
} from "@/types/domain";
import {
  createDemoAttendance,
  createDemoReferral,
  createDemoSupportCase,
  filterCases,
  findDemoCase,
  getOwnDemoCaseRecords,
  getOwnLatestDemoCase,
  mergeCaseCollections,
  mergeManagerStats,
  mergeProfessionalDashboard,
  updateDemoCaseStatus,
} from "@/lib/demo-case-store";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? "";

type RequestOptions = RequestInit & {
  body?: unknown;
};

async function request<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const headers = new Headers(options.headers);

  if (options.body !== undefined && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }

  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...options,
    credentials: "include",
    headers,
    body: options.body !== undefined ? JSON.stringify(options.body) : undefined,
  });

  if (response.status === 204) {
    return undefined as T;
  }

  const data = await response.json().catch(() => null);

  if (!response.ok) {
    throw new Error(data?.error ?? "Falha na comunicacao com a API.");
  }

  return data as T;
}

export const api = {
  async login(payload: LoginPayload) {
    return request<{ user: SessionUser }>("/api/auth/login", {
      method: "POST",
      body: payload,
    });
  },

  async registerWoman(payload: RegisterWomanPayload) {
    return request<{ user: SessionUser }>("/api/auth/register", {
      method: "POST",
      body: payload,
    });
  },

  async logout() {
    return request<void>("/api/auth/logout", {
      method: "POST",
    });
  },

  async me() {
    return request<{ user: SessionUser }>("/api/auth/me");
  },

  async getProfile() {
    return request<{ user: SessionUser }>("/api/profile");
  },

  async getOrganizations() {
    return request<{ organizations: Organization[] }>("/api/organizations");
  },

  async getWomanDashboard() {
    const remote = await request<WomanDashboardResponse>("/api/woman/dashboard");
    const latestDemoCase = getOwnLatestDemoCase();
    const ownDemoRecords = getOwnDemoCaseRecords();

    if (!latestDemoCase) {
      return remote;
    }

    const demoAttendances = ownDemoRecords.flatMap((item) => item.caseData.atendimentos);
    const demoReferrals = ownDemoRecords.flatMap((item) => item.caseData.encaminhamentos);
    const demoRequests = ownDemoRecords.flatMap((item) => item.caseData.solicitacoesApoio);

    return {
      caso: latestDemoCase,
      atendimentosRecentes: [...demoAttendances, ...remote.atendimentosRecentes]
        .sort((a, b) => new Date(b.data).getTime() - new Date(a.data).getTime())
        .slice(0, 4),
      encaminhamentosRecentes: [...demoReferrals, ...remote.encaminhamentosRecentes]
        .sort((a, b) => new Date(b.data).getTime() - new Date(a.data).getTime())
        .slice(0, 4),
      solicitacoesApoio: [...demoRequests, ...remote.solicitacoesApoio]
        .sort((a, b) => new Date(b.data).getTime() - new Date(a.data).getTime())
        .slice(0, 6),
    };
  },

  async getWomanCase() {
    const remote = await request<{ caso: CaseDetail | null }>("/api/woman/case");
    const latestDemoCase = getOwnLatestDemoCase();
    return { caso: latestDemoCase ?? remote.caso };
  },

  async createSupportRequest(payload: CreateSupportRequestPayload) {
    const demoCase = createDemoSupportCase(payload);

    request<{ caseId: string }>("/api/woman/help-requests", {
      method: "POST",
      body: payload,
    }).catch(() => undefined);

    return { caseId: demoCase.id };
  },

  async createInternalUser(payload: CreateInternalUserPayload) {
    return request<{ user: SessionUser }>("/api/internal/users", {
      method: "POST",
      body: payload,
    });
  },

  async getProfessionalDashboard() {
    const remote = await request<ProfessionalDashboardResponse>("/api/professional/dashboard");
    return mergeProfessionalDashboard(remote);
  },

  async getManagerDashboard() {
    const remote = await request<{ stats: ManagerStats }>("/api/manager/dashboard");
    return { stats: mergeManagerStats(remote.stats) };
  },

  async getManagerReportSummary() {
    return request<{ casosRecentes: CaseSummary[] }>("/api/manager/reports/summary");
  },

  async getCases(search = "", status = "todos") {
    const params = new URLSearchParams();
    if (search) params.set("search", search);
    if (status) params.set("status", status);
    const remote = await request<{ casos: CaseSummary[] }>(`/api/cases?${params.toString()}`);
    return {
      casos: filterCases(mergeCaseCollections(remote.casos), search, status),
    };
  },

  async getCase(id: string) {
    const demoCase = findDemoCase(id);
    if (demoCase) {
      return { caso: demoCase };
    }

    return request<{ caso: CaseDetail }>(`/api/cases/${id}`);
  },

  async updateCaseStatus(id: string, status: CaseStatus) {
    const demoCase = updateDemoCaseStatus(id, status);
    if (demoCase) {
      return { caso: demoCase };
    }

    return request<{ caso: CaseSummary }>(`/api/cases/${id}/status`, {
      method: "PATCH",
      body: { status },
    });
  },

  async createAttendance(payload: CreateAttendancePayload) {
    const demoAttendance = createDemoAttendance(payload);
    if (demoAttendance) {
      return { atendimento: demoAttendance };
    }

    return request("/api/attendances", {
      method: "POST",
      body: payload,
    });
  },

  async createReferral(payload: CreateReferralPayload) {
    const organizations = await this.getOrganizations().catch(() => ({ organizations: [] as Array<{ id: string; nome: string }> }));
    const orgName =
      organizations.organizations.find((item) => item.id === payload.orgaoDestinoId)?.nome ?? "Orgao de destino";
    const demoReferral = createDemoReferral(payload, orgName);

    if (demoReferral) {
      return { encaminhamento: demoReferral };
    }

    return request("/api/referrals", {
      method: "POST",
      body: payload,
    });
  },

  async downloadManagerReport(type: string) {
    const response = await fetch(`${API_BASE_URL}/api/manager/reports/${type}/export`, {
      credentials: "include",
    });

    if (!response.ok) {
      const data = await response.json().catch(() => null);
      throw new Error(data?.error ?? "Falha ao exportar relatorio.");
    }

    return response.blob();
  },
};
