import { create } from "zustand";
import { persist } from "zustand/middleware";

export type AuthRole = "ADMIN" | "MODERATOR";

export interface AuthUser {
  id?: string;
  username: string;
  role: AuthRole;
  name?: string | null;
  email?: string | null;
  status?: "ACTIVE" | "INACTIVE";
}

interface AuthState {
  user: AuthUser | null;
  token: string | null;
  isAuthenticated: boolean;
  login: (user: AuthUser, token: string) => void;
  logout: () => void;
  updateUser: (user: AuthUser) => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      token: null,
      isAuthenticated: false,
      login: (user, token) => set({ user, token, isAuthenticated: true }),
      logout: () => set({ user: null, token: null, isAuthenticated: false }),
      updateUser: (user) => set((state) => ({ ...state, user })),
    }),
    { name: "auth-storage" },
  ),
);

interface ThemeState {
  isDarkMode: boolean;
  toggleTheme: () => void;
}

export const useThemeStore = create<ThemeState>()(
  persist(
    (set) => ({
      isDarkMode: false,
      toggleTheme: () => set((state) => ({ isDarkMode: !state.isDarkMode })),
    }),
    { name: "theme-storage" },
  ),
);
