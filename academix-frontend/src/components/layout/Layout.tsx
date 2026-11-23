import { Outlet, useLocation } from "react-router-dom";
import "./Layout.css";
import Topbar from "./Topbar";
import { useFetchPermissions } from "../../hooks/useFetchPermissions";
import { usePermissionStore } from "../../store/permissionStore";
import { lazy, Suspense } from "react";
import { Spin } from "antd";
import { useRoleNavigation } from "../../hooks/useRoleNavigation";
import { useSelectionsStore } from "../../store/selectionStore";
import { FilteredDataContext, useComputeFilteredData } from "../../hooks/useFilteredData";
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

  useFetchPermissions();

  // #17: the hierarchy lists filtered by the selection, derived from the React Query data
  // (useHierarchyData) and provided to the app through FilteredDataContext. They used to be
  // written into a Zustand store by an effect here.
  const filteredData = useComputeFilteredData();
  const { filteredTeamMembers } = filteredData;
  useBlockColorEnabled(selectedTeam?.id, selectedCourseBatch?.id);


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
    <FilteredDataContext.Provider value={filteredData}>
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
    </FilteredDataContext.Provider>
  );
}
