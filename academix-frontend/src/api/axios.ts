import axios from "axios";
import type { AxiosError, AxiosRequestConfig, AxiosResponse } from "axios";
import { loadingService } from '../loading/LoadingService';
import { notification } from "antd";
// permissionStore / queryClient also import this module: only used inside functions, at request
// time, so the import cycle is safe.
import { usePermissionStore } from "../store/permissionStore";
import { useUserStore } from "../store/userStore";
import { queryClient } from "./queryClient";

const api = axios.create({
  baseURL: process.env.REACT_APP_API_BASE_URL,
  withCredentials: true,
});

// ---------------------------------------------------------------------------------------------
// Identity and active role (#13, step 2 of the contract)
// - The user comes from the httpOnly `token` cookie: X-User-Id / X-User-Name are not sent any more.
// - The active role is sent as X-Role-Assignment-Id = id of the RoleAssignment selected in
//   RoleSelect. The server checks it and derives the role and the allowed ids itself.
// ---------------------------------------------------------------------------------------------
const activeRoleAssignmentId = (): number | undefined => {
  const { selectedPermission, permissions } = usePermissionStore.getState();
  if (!selectedPermission) return undefined;
  if (selectedPermission.id) return selectedPermission.id;
  // DevDashboard builds a synthetic "system" permission (id 0) when a SYSTEM-ADMIN picks a
  // system: act with the user's own SYSTEM-ADMIN role assignment (the server refuses id 0).
  return permissions?.find((p) => p.role_code === "SYSTEM-ADMIN" && p.id)?.id;
};

api.interceptors.request.use((config: any) => {
  const roleAssignmentId = activeRoleAssignmentId();
  if (roleAssignmentId) config.headers["X-Role-Assignment-Id"] = String(roleAssignmentId);
  return config;
});

const isAuthRequest = (cfg?: AxiosRequestConfig) => /^\/?auth\//.test(cfg?.url ?? "");
const errorCode = (err: AxiosError) => (err.response?.data as { error?: string } | undefined)?.error;

// 401 { error: "unauthenticated" } = no valid session. Any other 401 (or a 409) is a business
// error ("קיים כבר תיוג בשם זה"...) and is left to the calling code, as before.
const handleUnauthenticated = async (err: AxiosError) => {
  const cfg: any = err.config;
  if (useUserStore.getState().authMode === "ntlm" && !cfg?.__authRetried) {
    // Closed network: silent Windows re-authentication, then one retry of the request.
    try {
      await api.get("/auth/ntlm");
      return api.request({ ...cfg, __authRetried: true });
    } catch {
      /* falls through to the error page */
    }
  }
  if (useUserStore.getState().authMode === "local") {
    // Session expired: back to the login page (App shows it when /auth/me answers 401).
    localStorage.removeItem("userInfo");
    window.location.assign("/");
  } else {
    window.location.assign(SESSION_ERROR_PATH);
  }
  return Promise.reject(err);
};

// 403 { error: "forbidden" } = the selected role assignment is not (or no longer) the user's:
// tell the user and reload the permissions from the server.
let lastForbiddenNotice = 0;
const handleForbidden = () => {
  if (Date.now() - lastForbiddenNotice > 5000) {
    lastForbiddenNotice = Date.now();
    notification.error({
      message: "אין הרשאה",
      description: "התפקיד שנבחר אינו מורשה לפעולה זו. ההרשאות נטענות מחדש.",
      placement: "top",
      style: { direction: "rtl" },
    });
  }
  queryClient.invalidateQueries({ queryKey: ["permissions"] });
};

export const SESSION_ERROR_PATH = "/session-error";

// Full-screen loader (GlobalLoader) only for blocking actions.
// Default: writes (POST/PUT/PATCH/DELETE) block, reads (GET) don't: background refetches used to
// cover the whole screen. Reads show the thin top bar (TopProgressBar) instead.
// Override per request: api.get(url, { globalLoader: true }) / api.post(url, data, { globalLoader: false }).
declare module "axios" {
  interface AxiosRequestConfig {
    globalLoader?: boolean;
  }
}

const GLOBAL_LOADER_FLAG = "__globalLoaderStarted";

const usesGlobalLoader = (cfg: AxiosRequestConfig) =>
  cfg.globalLoader ?? (cfg.method ?? "get").toLowerCase() !== "get";

const endGlobalLoader = (cfg: any) => {
  if (cfg?.[GLOBAL_LOADER_FLAG]) {
    cfg[GLOBAL_LOADER_FLAG] = false;
    loadingService.endRequest();
  }
};

api.interceptors.request.use((cfg: any) => {
  if (usesGlobalLoader(cfg)) {
    cfg[GLOBAL_LOADER_FLAG] = true;
    loadingService.startRequest();
  }
  return cfg;
});

api.interceptors.response.use(
  (res: AxiosResponse) => {
    endGlobalLoader(res.config);
    return res;
  },
  (err: AxiosError) => {
    endGlobalLoader(err.config);
    const status = err.response?.status;
    if (status === 401 && errorCode(err) === "unauthenticated" && !isAuthRequest(err.config)) {
      return handleUnauthenticated(err);
    }
    if (status === 403 && errorCode(err) === "forbidden") handleForbidden();
    return Promise.reject(err);
  }
);

export default api;