import "./App.css";
import { QueryClientProvider } from "@tanstack/react-query";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
import { AppRoutes } from "./routes/AppRoutes";
import { ConfigProvider, Spin } from "antd";
import Login from "./pages/Login/Login";
import heIL from "antd/locale/he_IL";
import { RouterProvider } from "react-router-dom";
import { useUserAuth } from "./utils/useUserAuth";
import { queryClient } from "./api/queryClient";
import { useQueryDebugger } from "./hooks/useQueryDebugger";
import { useEffect, useRef } from "react";
import { useDateValidation } from "./hooks/useDateValidation";
import { TopProgressBar } from "./loading/TopProgressBar";

function App() {
  const authStatus = useUserAuth();
  useDateValidation();
  
  const initRef = useRef(false);

 useEffect(() => {
  const syncUserInfo = async () => {
    // בדיקה אם כבר יש נתונים
    const existing = localStorage.getItem('userInfo');
    if (existing) {
      try {
        JSON.parse(existing);
        return; // כבר יש נתונים - לא צריך לעשות כלום
      } catch (e) {
        localStorage.removeItem('userInfo');
      }
    }

    // ניסיון לקרוא מ-cookie
    const cookieParts = document.cookie.split('; ');
    const userInfoCookie = cookieParts.find(row => row.startsWith('userInfo='));

    if (userInfoCookie && userInfoCookie.includes('=')) {
      const value = userInfoCookie.split('=').slice(1).join('=');
      
      if (value && value.trim() !== '' && value !== 'undefined' && value !== 'null') {
        try {
          const decoded = decodeURIComponent(value);
          if (decoded && decoded.trim() !== '') {
            const userInfo = JSON.parse(decoded);
            
            if (userInfo && userInfo.id) {
              const storageData = {
                id: userInfo.id,
                name: userInfo.name,
                username: userInfo.username,
              };
              localStorage.setItem('userInfo', JSON.stringify(storageData));
              return; // הצלחה!
            }
          }
        } catch (e) {
          console.warn('שגיאה בפרסור userInfo מ-cookie:', e);
        }
      }
    }

    // ❌ אם הגענו לכאן - אין נתונים
    // אפשר לרענן את הדף אוטומטית אחרי שנייה
    if (document.cookie.includes('userInfo=')) {
      setTimeout(() => {
        window.location.reload();
      }, 1000);
    }
  };

  syncUserInfo();
}, []);
  // ⬇️ העבר את ה-queryClient ל-hook ישירות
  // useQueryDebugger(queryClient, 300);

  return (
    <ConfigProvider
      direction="rtl"
      locale={heIL}
      theme={{
        components: {
          Modal: {
            colorBgMask: "rgba(0, 0, 0, 0.1)",
          },
          Input: {
            colorTextPlaceholder: "#333",
            activeBorderColor: "none",
            hoverBorderColor: "none",
          },
        },
      }}
    >
      {authStatus === "loading" ? (
        <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center" }}>
          <Spin size="large" />
        </div>
      ) : authStatus === "login" ? (
        <Login />
      ) : (
        <QueryClientProvider client={queryClient}>
          <TopProgressBar />
          <RouterProvider router={AppRoutes} />
          {process.env.NODE_ENV === "development" && <ReactQueryDevtools initialIsOpen={false} />}
        </QueryClientProvider>
      )}
    </ConfigProvider>
  );
}

export default App;