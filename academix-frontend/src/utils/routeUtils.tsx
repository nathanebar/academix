import { Outlet } from "react-router-dom";
import ProtectedRoute from "../components/ProtectedRoute";
import type { ReactNode } from "react";


type Role =
  | "SYSTEM-ADMIN"
  | "DOMAIN_MANAGER"
  | "COURSE_COMMANDER"
  | "ADMIN"
  | "TEAM_COMMANDER"
  | "OVERLAP"
  | "STUDENT";

interface RouteConfig {
  path: string;
  element: ReactNode;
  children?: RouteConfig[];
  allowedRoles?: Role[] |any;
  index?: boolean | any;
}


const withProtection = (config: RouteConfig): RouteConfig => {
  // אם אין roles מוגדרים, תחזיר כמו שזה (גישה חופשית)
  if (!config.allowedRoles || config.allowedRoles.length === 0) {
    return config;
  }

  return {
    ...config,
    element: (
      <ProtectedRoute allowedRoles={config.allowedRoles}>
        {config.element}
      </ProtectedRoute>
    ),
  };
};

// פונקציה ליצירת ראוט עם הגנה
export const createProtectedRoute = (
  path: string,
  element: ReactNode,
  allowedRoles: Role[] = []
): RouteConfig => {
  return withProtection({ path, element, allowedRoles });
};

// פונקציה ליצירת קבוצת ראוטים עם Outlet
export const createProtectedGroup = (
  path: string,
  children: RouteConfig[],
  allowedRoles: Role[] = []
): RouteConfig => {
  return withProtection({
    path,
    element: <Outlet />,
    children,
    allowedRoles,
  });
};