import { Outlet, useLocation } from "react-router-dom";
import "./Layout.css";
import Sidebar from "./Sidebar/Sidebar";
import Topbar from "./Topbar";
import { useFetchPermissions } from "../../hooks/useFetchPermissions";
import { usePermissionStore } from "../../store/permissionStore";
import { useFetchDomains } from "../../hooks/useFetchDomains";
import { useFetchTeams } from "../../hooks/useFetchTeams";
import { useFetchCourses } from "../../hooks/useFetchCourses";
import { useFetchCourseBatches } from "../../hooks/useFetchCourseBatch";
import { useEffect } from "react";
import { useRoleNavigation } from "../../hooks/useRoleNavigation";
import { useDomainStore } from "../../store/domainStore";
import { useTeamStore } from "../../store/teamStore";
import { useCourseStore } from "../../store/courseStore";
import { useCourseBatchStore } from "../../store/courseBatchStore";
import { useAxesStore } from "../../store/axiStore";
import { useSelectionsStore } from "../../store/selectionStore";
import { filterDataBySelection } from "../../utils/filterUtils";
import { useFilteredDataStore } from "../../store/filteredDataStore";
import { useTeamMembersStore } from "../../store/teamMemberStore";
import { useFetchTeamMembers } from "../../hooks/useFetchTeamMembers";
import { useFetchAxesBatchArchives } from "../../hooks/useFetchAxesBatchArchives";
import { useFetchCourseCommanders } from "../../hooks/useFetchCourseCommanders";
import { useBlockColorEnabled } from "../../hooks/useTeamBlockColor";

export default function Layout() {
  useRoleNavigation();
  const location = useLocation();
  const { domains } = useDomainStore();
  const { teams } = useTeamStore();
  const { courses } = useCourseStore();
  const { courseBatches, axisBatchArchive } = useCourseBatchStore();
  const { axes } = useAxesStore();
  const isInitialized = usePermissionStore((state) => state.isInitialized);
  const selectedPermission = usePermissionStore(
    (state) => state.selectedPermission
  );
  const { teamMembers } = useTeamMembersStore();

  const {
    selectedDomain,
    selectedCourse,
    selectedCourseBatch,
    selectedTeam,
    selectedTeamMember,
  } = useSelectionsStore();
  const {
    setFilteredDomains,
    setFilteredCourses,
    setFilteredCourseBatches,
    filteredTeams,
    setFilteredTeams,
    filteredTeamMembers,
    setFilteredTeamMembers,
    setFilteredAxis,
  } = useFilteredDataStore();

  useFetchPermissions();

  useFetchDomains(selectedPermission?.allowedDomainIds || []);
  useFetchCourses(
    selectedPermission?.allowedCourseIds || [],
    selectedDomain?.id
  );
  useFetchCourseBatches(
    selectedPermission?.allowedCourseBatcheIds || [],
    selectedCourse?.id
  );
  useFetchTeams(selectedPermission?.allowedTeamIds || [], courseBatches);
  // useFetchCourseCommanders(selectedCourse?.id);
  useFetchAxesBatchArchives(
    selectedPermission?.allowedCourseBatcheIds || [],
    selectedCourseBatch?.id ? selectedCourseBatch.id : null
  );
  useFetchTeamMembers(
    filteredTeams.map((team) => team.id),
    selectedCourseBatch?.id ? selectedCourseBatch?.id : null
  );
  useBlockColorEnabled(selectedTeam?.id, selectedCourseBatch?.id);

  useEffect(() => {
    const result = filterDataBySelection(
      selectedDomain,
      selectedCourse,
      selectedCourseBatch,
      selectedTeam,
      domains,
      teams,
      courses,
      courseBatches,
      axisBatchArchive,
      axes,
      teamMembers
    );
    setFilteredDomains(result.filteredDomains);
    setFilteredTeams(result.filteredTeams);
    setFilteredCourses(result.filteredCourses);
    setFilteredCourseBatches(result.filteredBatches);

    setFilteredTeamMembers(result.filteredTeamMembers);
    setFilteredAxis(result.filteredAxes);
  }, [
    selectedDomain,
    selectedCourse,
    selectedCourseBatch,
    selectedTeam,
    domains,
    teams,
    courses,
    courseBatches,
    axes,
    teamMembers,
  ]);

  const currentPath = location.pathname;

  // בדיקה האם הסיידבאר מוצג
  const isSidebarVisible =
    currentPath.includes("/calendar") ||
    (currentPath.includes("/courseContent") &&
      filteredTeamMembers.length > 0 &&
      (selectedTeamMember || selectedTeam));

  if (!isInitialized) {
    return <div className="loading">טוען...</div>;
  }
  // maybe need to make save the block color by team store here
  return (
    <div className="layout">
      {isSidebarVisible && <Sidebar />}
      <div className="main-content">
        <Topbar isSidebarVisible={isSidebarVisible} />
        <div className="page-content">
          <Outlet />
        </div>
      </div>
    </div>
  );
}
