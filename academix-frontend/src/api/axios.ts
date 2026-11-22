import axios from "axios";
import type { AxiosError, AxiosRequestConfig, AxiosResponse } from "axios";
import { loadingService } from '../loading/LoadingService';

const api = axios.create({
  baseURL: process.env.REACT_APP_API_BASE_URL,
  withCredentials: true,
});

// ⬇️ פונקציה בטוחה לקריאת localStorage
const getSafeUserInfo = () => {
  try {
    const userInfoStr = localStorage.getItem('userInfo');
    
    // ⬇️ בדיקות לפני פרסור
    if (!userInfoStr || 
        userInfoStr.trim() === '' || 
        userInfoStr === 'undefined' || 
        userInfoStr === 'null') {
      return null;
    }
    
    const userInfo = JSON.parse(userInfoStr);
    if (userInfo && userInfo.id) {
      return userInfo;
    }
    return null;
  } catch (e) {
    console.warn('שגיאה בקריאת userInfo:', e);
    localStorage.removeItem('userInfo');
    return null;
  }
};

api.interceptors.request.use((config: any) => {
  const userInfo = getSafeUserInfo();
  
  if (userInfo) {
    config.headers['X-User-Id'] = userInfo.id || '';
    config.headers['X-User-Name'] = userInfo.name || userInfo.username || '';
  }
  
  return config;
});

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
    return Promise.reject(err);
  }
);

export default api;