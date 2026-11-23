// Lists of the hierarchy filtered by the current selection (#17). They used to be written into
// a Zustand store (filteredDataStore) by an effect in Layout, and again by useSelectionHandler on
// each header selection (the same values, one render earlier). They are derived data: Layout
// computes them once with useMemo from the React Query data + the selection, and provides them
// through this context. Readers use useFilteredData().
import { createContext, useContext, useMemo } from "react";
import { useSelectionsStore } from "../store/selectionStore";
import { Axis, Course, CourseBatch, Domain, Team, TeamMembers } from "../types/types";
import { filterDataBySelection } from "../utils/filterUtils";
import {
  useAxisBatchArchiveData,
  useCourseBatchesData,
  useCoursesData,
  useDomainsData,
  useTeamMembersData,
  useTeamsData,
} from "./useHierarchyData";

export interface FilteredData {
  filteredDomains: Domain[];
  filteredCourses: Course[];
  filteredCourseBatches: CourseBatch[];
  filteredTeams: Team[];
  filteredAxis: Axis[];
  filteredTeamMembers: TeamMembers[];
}

// outside Layout (no provider) the lists are empty, like the store before Layout filled it
const EMPTY_FILTERED_DATA: FilteredData = {
  filteredDomains: [],
  filteredCourses: [],
  filteredCourseBatches: [],
  filteredTeams: [],
  filteredAxis: [],
  filteredTeamMembers: [],
};
const NO_AXES: Axis[] = []; // the axes store was never filled (#93)

export const FilteredDataContext = createContext<FilteredData>(EMPTY_FILTERED_DATA);

export const useFilteredData = (): FilteredData => useContext(FilteredDataContext);

// Used once, by Layout (the provider).
export const useComputeFilteredData = (): FilteredData => {
  const selectedDomain = useSelectionsStore((s) => s.selectedDomain);
  const selectedCourse = useSelectionsStore((s) => s.selectedCourse);
  const selectedCourseBatch = useSelectionsStore((s) => s.selectedCourseBatch);
  const selectedTeam = useSelectionsStore((s) => s.selectedTeam);

  const domains = useDomainsData();
  const courses = useCoursesData();
  const courseBatches = useCourseBatchesData();
  const teams = useTeamsData();
  const axisBatchArchive = useAxisBatchArchiveData();
  const teamMembers = useTeamMembersData();

  return useMemo(() => {
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
      NO_AXES,
      teamMembers
    );
    return {
      filteredDomains: result.filteredDomains,
      filteredCourses: result.filteredCourses,
      filteredCourseBatches: result.filteredBatches,
      filteredTeams: result.filteredTeams,
      filteredAxis: result.filteredAxes,
      filteredTeamMembers: result.filteredTeamMembers,
    };
  }, [
    selectedDomain,
    selectedCourse,
    selectedCourseBatch,
    selectedTeam,
    domains,
    teams,
    courses,
    courseBatches,
    axisBatchArchive,
    teamMembers,
  ]);
};
