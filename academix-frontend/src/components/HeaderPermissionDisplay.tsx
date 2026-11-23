import { useEffect, useMemo, useState } from "react";
import styles from "./HeaderPermissionDisplay.module.css";
import { SelectionDropdown } from "./SelectionDropdown";
import { useSelectionsStore } from "../store/selectionStore";
import {
  filterTeamsByBatch,
  filterCoursesBySelection,
  filterBatchesBySelection,
} from "../utils/filterUtils";
import { useFilteredDataStore } from "../store/filteredDataStore";
import { useSelectionHandler } from "../hooks/useSelectionHandler";
import { useNavigate } from "react-router-dom";
import { usePermissionStore } from "../store/permissionStore";
import {
  filterStudentMembers,
  TeamMember,
} from "../utils/filterStudentMembers";
import dayjs, { Dayjs } from "dayjs";
import { Button, ConfigProvider } from "antd";
import { RightOutlined } from "@ant-design/icons";
import { useCourseBatchesData, useCoursesData, useTeamsData } from "../hooks/useHierarchyData";

export const HeaderPermissionDisplay = () => {
  const _hasHydrated = useSelectionsStore((s) => s._hasHydrated);

  if (!_hasHydrated) {
    return <div>Loading...</div>;
  }
  const [showDropdown, setShowDropdown] = useState(false);
  const [dropdownType, setDropdownType] = useState<string | null>(null);
  const { selectedDate, activeHeaderType, setActiveHeaderType } =
    useSelectionsStore();
  const selectedPermission = usePermissionStore(
    (state) => state.selectedPermission
  );
  const navigate = useNavigate();

  const {
    filteredDomains,
    filteredCourses,
    setFilteredCourses,
    filteredCourseBatches,
    setFilteredCourseBatches,
    filteredTeams,
    setFilteredTeams,
    filteredTeamMembers,
    setFilteredTeamMembers,
  } = useFilteredDataStore();

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
  } = useSelectionsStore();

  const { handleSelectionChange } = useSelectionHandler(
    courses,
    courseBatches,
    teams,
    setSelectedDomain,
    setSelectedCourse,
    setSelectedCourseBatch,
    setSelectedTeam,
    setSelectedTeamMember,
    setFilteredCourses,
    setFilteredCourseBatches,
    setFilteredTeams,
    setShowDropdown,
    filterCoursesBySelection,
    filterBatchesBySelection,
    filterTeamsByBatch,
    activeHeaderType,
    setActiveHeaderType
  );

  // useEffect(() => {
  //   if (!activeHeaderType && selectedDomain) {
  //     setActiveHeaderType("domain");
  //   }
  // }, [activeHeaderType, selectedDomain]);
  function convertToNewFormat(originalArray: any) {
    return originalArray.map((item: any) => ({
      Team: item.Team,
      createdAt: item.createdAt,
      id: item.id,
      member_role: item.member_role,
      team_id: item.team_id,
      updatedAt: item.updatedAt,
      user_id: item.user_id,
      name: item.name || item.User.name,
      militaryId: item.militaryid || item.User.militaryId,
      delete_reason: item.delete_reason,
    }));
  }

  function useStudentMembers(
    teamMembers: TeamMember[],
    selectedDate: Dayjs
  ): TeamMember[] {
    return useMemo(() => {
      const filtered = filterStudentMembers({ teamMembers, selectedDate });

      return convertToNewFormat(filtered);
    }, [teamMembers, selectedDate?.valueOf()]);
  }

  const teamMembersConvert: any = useStudentMembers(
    filteredTeamMembers ? filteredTeamMembers : [],
    selectedDate ?? dayjs()
  );
  const toggleDropdown = (type: string) => {
    if (showDropdown && dropdownType === type) {
      setShowDropdown(false);
      setDropdownType(null);
    } else {
      setDropdownType(type);
      setShowDropdown(true);
    }
  };
  useEffect(() => {
    console.log(activeHeaderType)
    // ✅ On garde la valeur récupérée depuis le localStorage (via le store persisté)
    if (activeHeaderType) return;

    // ⬇️ Fallback uniquement au premier chargement, si rien n'est persisté
    const path = location.pathname;

    if (path.includes("/dashboard/domain")) {
      setActiveHeaderType("domain");
    }
    if (path.includes("/dashboard/course")) {
      setActiveHeaderType("course");
    }
    if (path.includes("/dashboard/courseBatch")) {
      setActiveHeaderType("courseBatches");
    }
    if (path.includes("/dashboard/team")) {
      setActiveHeaderType("team");
    }
    if (path.includes("/dashboard/teamMember")) {
      setActiveHeaderType("teamMember");
    }
  }, [location.pathname, setActiveHeaderType, activeHeaderType]);

  const hasPermission = (requiredRoles: string[]) => {
    if (!selectedPermission?.role_code) return false;
    return requiredRoles.includes(selectedPermission?.role_code);
  };

  const path = location.pathname;

  const handleHeaderClick = (type: string) => {
    const permissions: Record<string, string[]> = {
      domain: ["DOMAIN_MANAGER", "SYSTEM-ADMIN"],
      course: ["COURSE_COMMANDER", "DOMAIN_MANAGER", "SYSTEM-ADMIN"],
      team: [
        "TEAM_COMMANDER",
        "COURSE_COMMANDER",
        "DOMAIN_MANAGER",
        "SYSTEM-ADMIN",
        "OVERLAP",
      ],
      teamMember: [
        "TEAM_COMMANDER",
        "COURSE_COMMANDER",
        "DOMAIN_MANAGER",
        "SYSTEM-ADMIN",
        "STUDENT",
        "OVERLAP",
      ],
      courseBatches: ["COURSE_COMMANDER", "DOMAIN_MANAGER", "SYSTEM-ADMIN"],
    };

    const hasAccess = hasPermission(permissions[type] || []);

    if (!hasAccess) return;

    const isSpecialPath =
      path.includes("courseContent") ||
      path.includes("calendar") ||
      path.includes("feedbackDashboard") ||
      path.includes("forms") ||
      path.includes("feedbackDashboard") ||
      path.includes("surveyDashboard") ||
      path.includes("HoefOverview") ||
      path.includes("studentStatus") ||
      path.includes("Notebook") ||
      path.includes("knowledge-retention")

    if (type === "team") {
      setActiveHeaderType(type);
    }

    if (!isSpecialPath) {

      const routes: Record<string, string> = {
        domain: "/dashboard/domain",
        course: "/dashboard/course",
        courseBatches: "/dashboard/courseBatch",
        team: "/dashboard/team",
        teamMember: "/dashboard/teamMember",
      };

      setActiveHeaderType(type);
      navigate(routes[type] || "/untora");
    } else {
      const dropdownActions: Record<string, () => void> = {
        domain: () => {
          setActiveHeaderType("domain");
          toggleDropdown("domain");
          setSelectedTeam(null);
          setSelectedTeamMember(null);
        },
        course: () => {
          setActiveHeaderType("course");
          toggleDropdown("course");
          setSelectedTeam(null);
        },
        courseBatches: () => {
          setActiveHeaderType("courseBatches");
          toggleDropdown("courseBatches");
          setSelectedTeam(null);
          setSelectedTeamMember(null);
        },
        team: () => {
          toggleDropdown("team");
          setSelectedTeamMember(null);
        },
        teamMember: () => {
          toggleDropdown("teamMembers");
          if (filteredTeamMembers.length === 1) {
            setSelectedTeamMember(convertToNewFormat(filteredTeamMembers)[0]);
          }
        },
      };
      if (type !== "teamMember") {
        setActiveHeaderType(type);
        dropdownActions[type]?.();
      }
    }
  };

  const handleBack = () => {
    if (window.history.length > 1) {
      navigate(-1);
    } else {
      navigate("/");
    }
  };

  return (
    <ConfigProvider
      theme={{
        components: {
          Button: {
            defaultHoverBg: "black",
            defaultHoverBorderColor: "black",
            defaultHoverColor: "white",
          },
        },
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          position: "sticky",
          top: 64,
          zIndex: 999,
          background: "#f8f6f2",
        }}
      >
        <Button onClick={handleBack} className={styles.navButton}>
          <RightOutlined style={{ fontSize: "20px", fontWeight: 700 }} />
        </Button>

        <div className={styles.permissionContainer}>
          <SelectionDropdown
            selected={selectedDomain?.name}
            showDropdown={showDropdown}
            dropdownType={dropdownType}
            items={filteredDomains}
            onItemClick={(item) => handleSelectionChange("domain", item)}
            toggleDropdown={toggleDropdown}
            type="domain"
            onHeaderClick={() => handleHeaderClick("domain")}
            isActive={activeHeaderType === "domain"}
          />

          <SelectionDropdown
            selected={selectedCourse?.name ?? "בחר קורס"}
            showDropdown={showDropdown}
            dropdownType={dropdownType}
            items={filteredCourses}
            onItemClick={(item) => handleSelectionChange("course", item)}
            toggleDropdown={toggleDropdown}
            type="course"
            onHeaderClick={() => handleHeaderClick("course")}
            isActive={activeHeaderType === "course"}
          />

          {selectedCourse && (
            <SelectionDropdown
              selected={selectedCourseBatch?.name ?? "בחר מחזור"}
              showDropdown={showDropdown}
              dropdownType={dropdownType}
              items={filteredCourseBatches}
              onItemClick={(item) =>
                handleSelectionChange("courseBatches", item)
              }
              toggleDropdown={toggleDropdown}
              type="courseBatches"
              onHeaderClick={() => handleHeaderClick("courseBatches")}
              isActive={activeHeaderType === "courseBatches"}
            />
          )}

          {selectedCourseBatch && (
            <SelectionDropdown
              selected={selectedTeam?.name ?? "בחר צוות"}
              showDropdown={showDropdown}
              dropdownType={dropdownType}
              items={filteredTeams}
              onItemClick={(item) => handleSelectionChange("team", item)}
              toggleDropdown={toggleDropdown}
              type="team"
              onHeaderClick={() => handleHeaderClick("team")}
              isActive={activeHeaderType === "team"}
            />
          )}
          {!(location.pathname === "/survey/surveyDashboard") &&
          !(location.pathname === "/dashboard/HoefOverview") &&
          selectedTeam ? (
            teamMembersConvert.length > 0 ? (
              <SelectionDropdown
                selected={
                  (selectedTeamMember?.User?.name ||
                    selectedTeamMember?.name) ??
                  "בחר חבר צוות"
                }
                showDropdown={showDropdown}
                dropdownType={dropdownType}
                items={teamMembersConvert.filter(
                  (tm: any) => tm.member_role === "STUDENT"
                )}
                onItemClick={(item) =>
                  handleSelectionChange("teamMember", item)
                }
                toggleDropdown={toggleDropdown}
                type="teamMembers"
                onHeaderClick={() => handleHeaderClick("teamMember")}
                isActive={activeHeaderType === "teamMember"}
              />
            ) : (
              <div className={styles.permissionItem}>
                {" "}
                <span className={styles.permissionCaretDownOutlinedNotTeamM}>
                  אין חברי צוות
                </span>
              </div>
            )
          ) : (
            <div className={styles.permissionItem}>
              {" "}
              <span className={styles.permissionCaretDownOutlinedNotTeamM}>
                יש לבחור צוות
              </span>
            </div>
          )}
        </div>
      </div>
    </ConfigProvider>
  );
};