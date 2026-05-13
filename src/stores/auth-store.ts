import { create } from "zustand";
import { api } from "@/lib/api";
import { supabase } from "@/lib/supabase";
import type { LoginPayload, RegisterWomanPayload, SessionUser } from "@/types/domain";

interface AuthState {
  currentUser: SessionUser | null;
  isAuthenticated: boolean;
  isBootstrapping: boolean;
  setCurrentUser: (user: SessionUser | null) => void;
  hydrate: () => Promise<void>;
  login: (payload: LoginPayload) => Promise<SessionUser>;
  registerWoman: (payload: RegisterWomanPayload) => Promise<SessionUser>;
  logout: () => Promise<void>;
}

function toAuthErrorMessage(error: unknown, fallback: string) {
  if (error instanceof Error && error.message.trim()) {
    return error.message;
  }

  return fallback;
}

export const useAuthStore = create<AuthState>((set) => ({
  currentUser: null,
  isAuthenticated: false,
  isBootstrapping: true,

  setCurrentUser: (user) =>
    set({
      currentUser: user,
      isAuthenticated: Boolean(user),
    }),

  hydrate: async () => {
    try {
      const response = await api.me();
      set({
        currentUser: response.user,
        isAuthenticated: true,
        isBootstrapping: false,
      });
    } catch {
      if (supabase) {
        const { data } = await supabase.auth.getSession();
        const accessToken = data.session?.access_token;

        if (accessToken) {
          try {
            const response = await api.syncSupabaseSession(accessToken);
            set({
              currentUser: response.user,
              isAuthenticated: true,
              isBootstrapping: false,
            });
            return;
          } catch {
            // If the bridge fails, return to the regular login screen.
          }
        }
      }

      set({
        currentUser: null,
        isAuthenticated: false,
        isBootstrapping: false,
      });
    }
  },

  login: async (payload) => {
    if (!supabase) {
      throw new Error("A autenticação via Supabase ainda não foi configurada neste ambiente.");
    }

    const { data, error } = await supabase.auth.signInWithPassword({
      email: payload.email,
      password: payload.password,
    });

    if (error || !data.session?.access_token) {
      throw new Error(
        toAuthErrorMessage(error, "Não foi possível validar seu acesso. Confira e-mail, senha e o perfil selecionado."),
      );
    }

    let response;
    try {
      response = await api.syncSupabaseSession(data.session.access_token, payload.perfil);
    } catch (error) {
      throw new Error(toAuthErrorMessage(error, "Sua conta foi autenticada, mas não conseguiu entrar no ambiente Athena."));
    }

    set({
      currentUser: response.user,
      isAuthenticated: true,
    });
    return response.user;
  },

  registerWoman: async (payload) => {
    if (!supabase) {
      throw new Error("O cadastro da Mulher via Supabase ainda não foi configurado neste ambiente.");
    }

    const { data, error } = await supabase.auth.signUp({
      email: payload.email,
      password: payload.password,
      options: {
        data: {
          nomeCompleto: payload.nomeCompleto,
          nomeSocial: payload.nomeSocial,
          cpf: payload.cpf,
          dataNascimento: payload.dataNascimento,
          telefone: payload.telefone,
          endereco: payload.endereco,
          municipio: payload.municipio,
          uf: payload.uf,
        },
      },
    });

    if (error) {
      throw new Error(toAuthErrorMessage(error, "Não foi possível criar sua conta agora."));
    }

    const accessToken = data.session?.access_token;
    if (!accessToken) {
      throw new Error("Conta criada. Confirme o e-mail enviado pelo Supabase para concluir o primeiro acesso.");
    }

    let response;
    try {
      response = await api.syncSupabaseWoman(accessToken, payload);
    } catch (error) {
      throw new Error(toAuthErrorMessage(error, "Sua conta foi criada, mas ainda não conseguiu concluir a vinculação inicial."));
    }

    set({
      currentUser: response.user,
      isAuthenticated: true,
    });
    return response.user;
  },

  logout: async () => {
    await supabase?.auth.signOut().catch(() => undefined);
    await api.logout().catch(() => undefined);
    set({
      currentUser: null,
      isAuthenticated: false,
    });
  },
}));
