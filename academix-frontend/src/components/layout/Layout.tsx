import { Outlet, useLocation } from "react-router-dom";
import "./Layout.css";
import Topbar from "./Topbar";
import { useFetchPermissions } from "../../hooks/useFetchPermissions";
import { usePermissionStore } from "../../store/permissionStore";
import { lazy, Suspense, useEffect } from "react";
import { Spin } from "antd";
import { useRoleNavigation } from "../../hooks/useRoleNavigation";
import { useSelectionsStore } from "../../store/selectionStore";
import { filterDataBySelection } from "../../utils/filterUtils";
import { useFilteredDataStore } from "../../store/filteredDataStore";
import {
  useAxisBatchArchiveData,
  useCourseBatchesData,
  useCoursesData,
  useDomainsData,
  useTeamMembersData,
  useTeamsData,
} from "../../hooks/useHierarchyData";
import { useBlockColorEnabled } from "../../hooks/useTeamBlockColor";

// The sidebar (calendars, day view, task modal) is only shown on /calendar and /courseContent:
// load it on demand instead of on every page.
const Sidebar = lazy(() => import("./Sidebar/Sidebar"));

export default function Layout() {
  useRoleNavigation();
  const location = useLocation();
  const isInitialized = usePermissionStore((state) => state.isInitialized);
  const selectedPermission = usePermissionStore(
    (state) => state.selectedPermission
  );

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

  // #17: server data of the hierarchy, from React Query (these hooks run the queries that
  // used to be mounted here and copied into Zustand stores)
  const domains = useDomainsData();
  const courses = useCoursesData();
  const courseBatches = useCourseBatchesData();
  const teams = useTeamsData();
  const axisBatchArchive = useAxisBatchArchiveData();
  const teamMembers = useTeamMembersData();
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
      [], // axes: the axes store was never filled (its only writer, useFetchAxes, was unused)
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
    axisBatchArchive, // was missing: the filtered axes did not follow the archive
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
      {isSidebarVisible && (
        <Suspense fallback={null}>
          <Sidebar />
        </Suspense>
      )}
      <div className="main-content">
        <Topbar isSidebarVisible={isSidebarVisible} />
        <div className="page-content">
          {/* Pages are lazy-loaded (routes/AppRoutes.tsx): fallback while a page chunk loads */}
          <Suspense
            fallback={
              <div style={{ display: "flex", justifyContent: "center", padding: "15vh 0" }}>
                <Spin size="large" />
              </div>
            }
          >
            <Outlet />
          </Suspense>
        </div>
      </div>
    </div>
  );
}
