import { Navigate } from "react-router-dom";
import { usePermissionStore } from "../store/permissionStore";

import { useMemo } from "react";

interface ProtectedRouteProps {
  children: React.ReactNode;
  allowedRoles: string[];
}
const ProtectedRoute: React.FC<ProtectedRouteProps> = ({
  children,
  allowedRoles,
}) => {
  const selectedPermission = usePermissionStore((s) => s.selectedPermission);

  const hasAccess = useMemo(() => {
    if (!selectedPermission) return true;
    return (
      selectedPermission?.role_code &&
      allowedRoles.includes(selectedPermission?.role_code)
    );
  }, [selectedPermission?.role_code, allowedRoles]);

  if (!hasAccess) {
    return <Navigate to="/unauthorized" replace />;
  }

  return <>{children}</>;
};
export default ProtectedRoute;