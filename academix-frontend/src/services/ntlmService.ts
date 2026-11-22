import api from "../api/axios";

const API = `${process.env.REACT_APP_API_BASE_URL}`;

export type AuthMode = "ntlm" | "local";

export type AuthUser = {
  id: number;
  name: string;
  username: string;
  militaryid: string;
};

// Mode d'authentification du backend : "ntlm" (réseau fermé) ou "local" (username/password).
// Si le backend ne connaît pas /auth/mode, on garde le comportement historique (NTLM).
export const getAuthMode = async (): Promise<AuthMode> => {
  try {
    const res = await api.get(`/auth/mode`, { withCredentials: true });
    return res.data?.mode === "local" ? "local" : "ntlm";
  } catch {
    return "ntlm";
  }
};

export const fetchUser = async () => {
  try {
    const res = await api.get(`/auth/ntlm`, {
      withCredentials: true,
    });

    return res.data.user;
  } catch (err) {
    console.log("Not authenticated");
  }
};

// Utilisateur de la session courante (cookie JWT), ou null.
export const fetchMe = async (): Promise<AuthUser | null> => {
  try {
    const res = await api.get(`/auth/me`, { withCredentials: true });
    return res.data?.user ?? null;
  } catch {
    return null;
  }
};

export const login = async (username: string, password: string): Promise<AuthUser> => {
  const res = await api.post(
    `/auth/login`,
    { username, password },
    { withCredentials: true }
  );
  return res.data.user;
};

export const logout = async () => {
  try {
    await api.post(`/auth/logout`, {}, { withCredentials: true });
  } finally {
    localStorage.removeItem("userInfo");
  }
};

export const storeUserInfo = (user: AuthUser) => {
  localStorage.setItem(
    "userInfo",
    JSON.stringify({ id: user.id, name: user.name, username: user.username })
  );
};
