import { create } from 'zustand';
import { type UserProfile, type UserAccount, users } from '@/data/mock-data';

interface AuthState {
  currentUser: UserAccount | null;
  isAuthenticated: boolean;
  login: (email: string, password: string) => boolean;
  selectProfile: (profile: UserProfile) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  currentUser: null,
  isAuthenticated: false,
  login: (email: string, _password: string) => {
    const user = users.find(u => u.email === email);
    if (user) {
      set({ currentUser: user, isAuthenticated: true });
      return true;
    }
    // For demo: any email works, default to profissional
    set({
      currentUser: {
        id: 'demo',
        nome: 'Usuário Demo',
        email,
        perfil: 'profissional',
        orgao: 'sec-mulher',
      },
      isAuthenticated: true,
    });
    return true;
  },
  selectProfile: (profile) => {
    const user = users.find(u => u.perfil === profile);
    if (user) {
      set({ currentUser: user, isAuthenticated: true });
    }
  },
  logout: () => set({ currentUser: null, isAuthenticated: false }),
}));
