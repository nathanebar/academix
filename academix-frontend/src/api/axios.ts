import axios, { AxiosError, AxiosRequestConfig, AxiosResponse } from "axios";
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

api.interceptors.request.use(
  (cfg: any) => {
    loadingService.startRequest();
    return cfg;
  },
  (err: AxiosError) => {
    loadingService.endRequest();
    return Promise.reject(err);
  }
);

api.interceptors.response.use(
  (res: AxiosResponse) => {
    loadingService.endRequest();
    return res;
  },
  (err: AxiosError) => {
    loadingService.endRequest();
    return Promise.reject(err);
  }
);

export default api;