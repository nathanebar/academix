import { useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { usePermissionStore } from "../store/permissionStore";
import { useSelectionsStore } from "../store/selectionStore";
import { useUserStore } from "../store/userStore";
import { useQueryClient } from "@tanstack/react-query";
import { studentTeamMemberQuery } from "./useStudentTeamMember";

export const useRoleNavigation = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const location = useLocation();
  
  const selectedPermission = usePermissionStore(
    (state) => state.selectedPermission
  );
  
  const { setSelectedTeamMember } = useSelectionsStore();
  const { user } = useUserStore();

  useEffect(() => {
    // 🔽 תיקון: בדיקה מלאה יותר
    if (!selectedPermission?.role_code || location.pathname !== "/") {
      return;
    }


    switch (selectedPermission?.role_code) {
      case "SYSTEM-ADMIN":
        navigate("/calendar");
        break;
        
      case "DEVELOPER":
        navigate("/dashboard/dev");
        break;
        
      case "COURSE_COMMANDER":
        // navigate("/dashboard/course");
        break;
        
      case "TEAM_COMMANDER":
        navigate("/calendar");
        break;
        
      case "STUDENT":
        // 🔽 תיקון: בדיקה ש-user.id ו-scope_id קיימים
        if (selectedPermission.user_id && selectedPermission.scope_id) {
          // same query as RoleSelect: shares its request instead of sending a second one
          queryClient
            .fetchQuery(studentTeamMemberQuery(selectedPermission.user_id, selectedPermission.scope_id))
            .then((teamMember: any) => {
              if (teamMember) {
                setSelectedTeamMember(teamMember);
              }
            })
            .catch((error: any) => {
              console.error("Error fetching team member:", error);
            });
            
          navigate("/calendar");
        }
        break;
        
      case "OVERLAP":
        navigate("/calendar");
        break;
        
      default:
        navigate("/untora");
    }
  }, [
    navigate, 
    location.pathname, 
    selectedPermission,
    selectedPermission?.role_code,
    selectedPermission?.scope_id,
    user,
    user?.id,
    setSelectedTeamMember
  ]);
};