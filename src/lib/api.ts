import type {
  CaseDetail,
  CaseStatus,
  CaseSummary,
  CreateAttendancePayload,
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
    return request<WomanDashboardResponse>("/api/woman/dashboard");
  },

  async getWomanCase() {
    return request<{ caso: CaseDetail | null }>("/api/woman/case");
  },

  async createSupportRequest(payload: CreateSupportRequestPayload) {
    return request<{ caseId: string }>("/api/woman/help-requests", {
      method: "POST",
      body: payload,
    });
  },

  async getProfessionalDashboard() {
    return request<ProfessionalDashboardResponse>("/api/professional/dashboard");
  },

  async getManagerDashboard() {
    return request<{ stats: ManagerStats }>("/api/manager/dashboard");
  },

  async getManagerReportSummary() {
    return request<{ casosRecentes: CaseSummary[] }>("/api/manager/reports/summary");
  },

  async getCases(search = "", status = "todos") {
    const params = new URLSearchParams();
    if (search) params.set("search", search);
    if (status) params.set("status", status);
    return request<{ casos: CaseSummary[] }>(`/api/cases?${params.toString()}`);
  },

  async getCase(id: string) {
    return request<{ caso: CaseDetail }>(`/api/cases/${id}`);
  },

  async updateCaseStatus(id: string, status: CaseStatus) {
    return request<{ caso: CaseSummary }>(`/api/cases/${id}/status`, {
      method: "PATCH",
      body: { status },
    });
  },

  async createAttendance(payload: CreateAttendancePayload) {
    return request("/api/attendances", {
      method: "POST",
      body: payload,
    });
  },

  async createReferral(payload: CreateReferralPayload) {
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
