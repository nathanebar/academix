import { create } from 'zustand';

type User = {
  id: number;
  name: string;
  username: string;
  militaryid: string;
};

type AuthMode = "ntlm" | "local";

type UserState = {
  user: User | null;
  setUser: (user: User) => void;
  authMode: AuthMode | null;
  setAuthMode: (mode: AuthMode) => void;
};

export const useUserStore = create<UserState>((set) => ({
  user: null,
  setUser(user) { set({ user });},
  authMode: null,
  setAuthMode(authMode) { set({ authMode }); },
}));
