import { useState,useEffect } from "react";
import { ConfigProvider, Dropdown, Menu, MenuProps } from "antd";
import he_IL from "antd/locale/he_IL";
import { useNavigate } from "react-router-dom";

import { usePermissionStore } from "../store/permissionStore";
import { useUserStore } from "../store/userStore";
import { useRoleNavigation } from "../hooks/useRoleNavigation";
import { useSelectionHandler } from "../hooks/useSelectionHandler";
import { useFilteredData } from "../hooks/useFilteredData";
import { useSelectionsStore } from "../store/selectionStore";

import {
  filterTeamsByBatch,
  filterCoursesBySelection,
  filterBatchesBySelection,
} from "../utils/filterUtils";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { studentTeamMemberQuery } from "../hooks/useStudentTeamMember";

import Photo from "../UI/Photo/Photo";
import { useCourseBatchesData, useCoursesData, useTeamsData } from "../hooks/useHierarchyData";

export const RoleSelect = () => {
  const { permissions, selectedPermission, setSelectedPermission } =
    usePermissionStore();
  const { user } = useUserStore();

  const { filteredDomains, filteredCourses, filteredCourseBatches, filteredTeams, filteredTeamMembers } = useFilteredData();

  const teams = useTeamsData();
  const courses = useCoursesData();
  const courseBatches = useCourseBatchesData();

  const {
    setSelectedDomain,
    selectedDomain,
    setSelectedCourse,
    selectedCourse,
    setSelectedCourseBatch,
    selectedCourseBatch,
    setSelectedTeam,
    selectedTeam,
    selectedTeamMember,
    setSelectedTeamMember,
    activeHeaderType,
    setActiveHeaderType,
  } = useSelectionsStore();


  // STUDENT role: its team member becomes the selected one (React Query, #17)
  const queryClient = useQueryClient();
  const isStudentRole =
    selectedPermission?.role_code === "STUDENT" &&
    !!selectedPermission?.user_id &&
    !!selectedPermission?.scope_id;
  const { data: studentTeamMember } = useQuery({
    ...studentTeamMemberQuery(selectedPermission?.user_id, selectedPermission?.scope_id),
    enabled: isStudentRole,
  });
  useEffect(() => {
    if (isStudentRole && studentTeamMember) setSelectedTeamMember(studentTeamMember);
    // also on a role change when the team member is already cached (same data reference)
  }, [studentTeamMember, selectedPermission?.id]);

  useRoleNavigation();
  const navigate = useNavigate();

  
  const { handleSelectionChange } = useSelectionHandler(
    courses,
    courseBatches,
    teams,
    setSelectedDomain,
    setSelectedCourse,
    setSelectedCourseBatch,
    setSelectedTeam,
    setSelectedTeamMember,
    () => {},
    filterCoursesBySelection,
    filterBatchesBySelection,
    filterTeamsByBatch,
    activeHeaderType,
    setActiveHeaderType
  );

  const getRoleLabel = (roleCode?: string) => {
    switch (roleCode) {
      case "SYSTEM-ADMIN":
        return "מבט מערכת";
      case "DOMAIN_MANAGER":
        return "מבט מנהל תחום";
      case "COURSE_COMMANDER":
        return 'מבט מק"ס';
      case "TEAM_COMMANDER":
        return 'מבט מפ"צ';
      case "OVERLAP":
        return "מבט חופף";
      case "STUDENT":
        return "מבט חניך";
      case "DEVELOPER":
        return "מבט מפתח";
      default:
        return "אחר";
    }
  };

  const getScopeName = (scopeType?: string, scopeName?: string) => {
    const validTypes = [
      "system",
      "domain",
      "course",
      "team",
      "OVERLAP",
      "STUDENT",
      "admin",
    ];
    if (scopeType && validTypes.includes(scopeType)) {
      return scopeName || "אחר";
    }
    return "אחר";
  };

  const handleRoleSelect: MenuProps["onClick"] = (info) => {
    const { key } = info;

    const role =
      permissions.find((p) => String(p.id) === key) ||
      permissions.find((p) => `${p.role_code}-${p.scope_id}` === key);

    if (!role) return;

    switch (role.role_code) {
      case "DOMAIN_MANAGER":
      case "SYSTEM-ADMIN":
        navigate("/calendar");
        break;
      case "DEVELOPER":
        navigate("/calendar");
        break;
      case "COURSE_COMMANDER":
        navigate("/calendar");
        break;
      case "TEAM_COMMANDER":
        navigate("/calendar");
        break;
      case "STUDENT":
        handleSelectionChange("teamMember", selectedTeamMember);

        const targetTeam = filteredTeams?.find(
          (item: any) => item?.id === role?.scope_id
        );

        if (role.user_id && role.scope_id) {
          
          
          // same query as above: shares the request with the role-change fetch
          queryClient
            .fetchQuery(studentTeamMemberQuery(role.user_id, role.scope_id))
            .then((teamMember: any) => {
              if (teamMember) {
                setSelectedTeamMember(teamMember);
                setSelectedTeam(targetTeam);
                navigate("/calendar");
              }
            })
            .catch((err) => console.error("Error fetching team member:", err));
        }
        break;
      case "OVERLAP":
        navigate("/calendar");
        break;
      default:
        navigate("/untora");
    }

    setSelectedPermission(role);
  };

  const validPermissions = permissions
    .filter((p) => p.scope_id !== undefined)
    .sort((a, b) => {
      const roleOrder: Record<string, number> = {
        DEVELOPER: 1,
        "SYSTEM-ADMIN": 2,
        DOMAIN_MANAGER: 3,
        COURSE_COMMANDER: 4,
        TEAM_COMMANDER: 5,
        OVERLAP: 6,
        STUDENT: 7,
      };

      const orderA = roleOrder[a.role_code] ?? 999;
      const orderB = roleOrder[b.role_code] ?? 999;

      if (orderA !== orderB) {
        return orderA - orderB;
      }

      return (a.scopeName || "").localeCompare(b.scopeName || "");
    });
  
    
  
  const menuProps: MenuProps = {
    items: validPermissions.map((p) => ({
      
      label: (
        <div
          style={{
            width: "15vw",
            height: "3vh",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            padding: 5,
          }}
        >
          <p
            style={{
              fontSize: "15px",
              fontWeight: 600,
              textDecoration: "underline",
            }}
          >
            {getRoleLabel(p.role_code)}
          </p>
          <p style={{fontSize:12}}>{p?.User?.name ? p?.User?.name : "(אתה)"}</p>
          <p>{getScopeName(p.scope_type, p.scopeName)}</p>
        </div>
      ),

      key: String(p.id ?? `${p.role_code}-${p.scope_id}`),
    })),
    onClick: handleRoleSelect,
    selectedKeys: selectedPermission?.id?.toString()
      ? [selectedPermission.id.toString()]
      : selectedPermission?.scope_id?.toString()
      ? [selectedPermission.scope_id.toString()]
      : [],
  };

  return (
    <ConfigProvider
      locale={he_IL}
      theme={{
        components: {
          Dropdown: {
            colorBgElevated: "white",
            colorText: "black",
            colorPrimary: "black",
            controlItemBgActive: "rgb(244, 241, 235)",
            controlItemBgActiveHover: "none",
            borderRadius: 50,
          },
        },
      }}
    >
    <Dropdown
  menu={menuProps}
  placement="bottomLeft"
  overlayStyle={{ margin: 5 }}
  trigger={["click"]}
  arrow
>
        <a
          style={{
            height: "5vh",
            marginTop: "0.5vh",
            display: "flex",
            alignItems: "center",
          }}
        >
          <Photo
            username={user?.username}
            style={{
              width: "3.5rem",
              height: "3.5rem",
              cursor: "pointer",
            }}
          />
        </a>
      </Dropdown>
    </ConfigProvider>
  );
};
