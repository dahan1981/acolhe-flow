import type {
  AuditLogItem,
  CaseDetail,
  CaseStatus,
  CaseSummary,
  ConfirmContactChangePayload,
  ContactChangeRequestPayload,
  ContactChangeRequestResponse,
  CreateAttendancePayload,
  CreateCasePayload,
  ChatTicket,
  CreateInternalUserPayload,
  CreateReferralPayload,
  CreateSupportRequestPayload,
  LoginPayload,
  ManagerStats,
  Organization,
  ProfileResponse,
  ProfessionalDashboardResponse,
  RegisterWomanPayload,
  SessionUser,
  UpdateProfilePayload,
  UserNotificationItem,
  UserProfile,
  WomanDashboardResponse,
} from "@/types/domain";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? "";

type RequestOptions = Omit<RequestInit, "body"> & {
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
    return request<{ user: SessionUser }>("/api/session/login", {
      method: "POST",
      body: payload,
    });
  },

  async registerWoman(payload: RegisterWomanPayload) {
    return request<{ user: SessionUser }>("/api/session/register", {
      method: "POST",
      body: payload,
    });
  },

  async syncSupabaseWoman(accessToken: string, profile?: RegisterWomanPayload) {
    return request<{ user: SessionUser }>("/api/session/women/supabase", {
      method: "POST",
      body: {
        accessToken,
        profile,
      },
    });
  },

  async syncSupabaseSession(accessToken: string, perfil?: UserProfile) {
    return request<{ user: SessionUser }>("/api/session/supabase", {
      method: "POST",
      body: {
        accessToken,
        perfil,
      },
    });
  },

  async logout() {
    return request<void>("/api/session/logout", {
      method: "POST",
    });
  },

  async me() {
    return request<{ user: SessionUser }>("/api/session/me");
  },

  async getProfile() {
    return request<ProfileResponse>("/api/profile");
  },

  async updateProfile(payload: UpdateProfilePayload) {
    return request<ProfileResponse>("/api/profile", {
      method: "PATCH",
      body: payload,
    });
  },

  async requestContactChange(payload: ContactChangeRequestPayload) {
    return request<ContactChangeRequestResponse>("/api/profile/contact-changes/request", {
      method: "POST",
      body: payload,
    });
  },

  async confirmContactChange(payload: ConfirmContactChangePayload) {
    return request<ProfileResponse>("/api/profile/contact-changes/confirm", {
      method: "POST",
      body: payload,
    });
  },

  async updateProfileAvatar(payload: {
    imageBase64: string;
    contentType: "image/jpeg" | "image/png" | "image/webp";
    fileName: string;
  }) {
    return request<ProfileResponse>("/api/profile/avatar", {
      method: "POST",
      body: payload,
    });
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
    return request<{ caseId: string; solicitacao: unknown }>("/api/woman/help-requests", {
      method: "POST",
      body: payload,
    });
  },

  async createInternalUser(payload: CreateInternalUserPayload) {
    return request<{ user: SessionUser }>("/api/internal/users", {
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

  async createCase(payload: CreateCasePayload) {
    return request<{ caso: CaseSummary }>("/api/cases", {
      method: "POST",
      body: payload,
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

  async getChats() {
    return request<{ chats: ChatTicket[] }>("/api/chats");
  },

  async getChat(id: string) {
    return request<{ chat: ChatTicket }>(`/api/chats/${id}`);
  },

  async createChat(context?: string) {
    return request<{ chat: ChatTicket }>("/api/chats", {
      method: "POST",
      body: { context },
    });
  },

  async sendChatMessage(id: string, body: string) {
    return request<{ chat: ChatTicket }>(`/api/chats/${id}/messages`, {
      method: "POST",
      body: { body },
    });
  },

  async assumeChat(id: string) {
    return request<{ chat: ChatTicket }>(`/api/chats/${id}/assume`, {
      method: "POST",
    });
  },

  async markChatAsRead(id: string) {
    return request<{ chat: ChatTicket }>(`/api/chats/${id}/read`, {
      method: "POST",
    });
  },

  async closeChat(id: string) {
    return request<{ chat: ChatTicket }>(`/api/chats/${id}/close`, {
      method: "POST",
    });
  },

  async getMyAuditLogs() {
    return request<{ logs: AuditLogItem[] }>("/api/audit-logs/me");
  },

  async getMyNotifications() {
    return request<{ notifications: UserNotificationItem[] }>("/api/notifications/me");
  },

  async getMapIncidents() {
    return request<{ incidents: Array<{ id: string; city: string; state: string; riskLevel: string; count: number; lat: number; lng: number }> }>("/api/map/incidents");
  },
};
