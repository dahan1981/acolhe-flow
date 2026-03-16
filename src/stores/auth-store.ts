import { create } from "zustand";
import { api } from "@/lib/api";
import { syncDemoSessionUser } from "@/lib/demo-case-store";
import type { LoginPayload, RegisterWomanPayload, SessionUser } from "@/types/domain";

interface AuthState {
  currentUser: SessionUser | null;
  isAuthenticated: boolean;
  isBootstrapping: boolean;
  hydrate: () => Promise<void>;
  login: (payload: LoginPayload) => Promise<SessionUser>;
  registerWoman: (payload: RegisterWomanPayload) => Promise<SessionUser>;
  logout: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set) => ({
  currentUser: null,
  isAuthenticated: false,
  isBootstrapping: true,

  hydrate: async () => {
    try {
      const response = await api.me();
      syncDemoSessionUser(response.user);
      set({
        currentUser: response.user,
        isAuthenticated: true,
        isBootstrapping: false,
      });
    } catch {
      syncDemoSessionUser(null);
      set({
        currentUser: null,
        isAuthenticated: false,
        isBootstrapping: false,
      });
    }
  },

  login: async (payload) => {
    const response = await api.login(payload);
    syncDemoSessionUser(response.user);
    set({
      currentUser: response.user,
      isAuthenticated: true,
    });
    return response.user;
  },

  registerWoman: async (payload) => {
    const response = await api.registerWoman(payload);
    syncDemoSessionUser(response.user);
    set({
      currentUser: response.user,
      isAuthenticated: true,
    });
    return response.user;
  },

  logout: async () => {
    await api.logout().catch(() => undefined);
    syncDemoSessionUser(null);
    set({
      currentUser: null,
      isAuthenticated: false,
    });
  },
}));
