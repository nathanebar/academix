// Server data of the selection hierarchy (#17). Domains, courses, batches, teams, team members and
// the batch's axis archive used to be copied into Zustand stores by `meta.onSuccess` of queries
// mounted in Layout. They now live only in React Query; components read them through these hooks.
//
// Each hook computes the same arguments as Layout (allowed ids of the selected permission + the
// selection), so every caller shares one cache entry: no extra request. Selectors keep the
// re-renders as narrow as the former store subscriptions.
import { queryClient } from "../api/queryClient";
import { usePermissionStore } from "../store/permissionStore";
import { useSelectionsStore } from "../store/selectionStore";
import { useMemo } from "react";
import { filterTeamsByBatch } from "../utils/filterUtils";
import { Course, CourseBatch, Domain, Team, TeamMembers } from "../types/types";
import { useFetchDomains } from "./useFetchDomains";
import { useFetchCourses } from "./useFetchCourses";
import { useFetchCourseBatches } from "./useFetchCourseBatch";
import { useFetchTeams } from "./useFetchTeams";
import { useFetchTeamMembers } from "./useFetchTeamMembers";
import { useFetchAxesBatchArchives } from "./useFetchAxesBatchArchives";

// one stable empty array: a new `[]` on each render would change memo / effect dependencies
const EMPTY: any[] = [];

export const useDomainsData = (): Domain[] => {
  const allowed = usePermissionStore((s) => s.selectedPermission?.allowedDomainIds);
  return useFetchDomains(allowed || EMPTY).data ?? EMPTY;
};

export const useCoursesData = (): Course[] => {
  const allowed = usePermissionStore((s) => s.selectedPermission?.allowedCourseIds);
  const selectedDomainId = useSelectionsStore((s) => s.selectedDomain?.id);
  return useFetchCourses(allowed || EMPTY, selectedDomainId).data ?? EMPTY;
};

export const useCourseBatchesData = (): CourseBatch[] => {
  const allowed = usePermissionStore((s) => s.selectedPermission?.allowedCourseBatcheIds);
  const selectedCourseId = useSelectionsStore((s) => s.selectedCourse?.id);
  return useFetchCourseBatches(allowed || EMPTY, selectedCourseId).data ?? EMPTY;
};

export const useTeamsData = (): Team[] => {
  const allowed = usePermissionStore((s) => s.selectedPermission?.allowedTeamIds);
  // the teams key held the batches (Layout passed the store's list), so teams refetch when the
  // batches change, as before
  const courseBatches = useCourseBatchesData();
  return useFetchTeams(allowed || EMPTY, courseBatches).data ?? EMPTY;
};

export const useTeamMembersData = (): TeamMembers[] => {
  // members of the teams of the selected batch (the filtered teams, computed here: Layout's
  // filtered lists are derived from this hook's result)
  const teams = useTeamsData();
  const selectedCourseBatch = useSelectionsStore((s) => s.selectedCourseBatch);
  const selectedCourseBatchId = selectedCourseBatch?.id;
  const teamIds = useMemo(
    () => filterTeamsByBatch(teams as any[], selectedCourseBatch).map((team) => team.id),
    [teams, selectedCourseBatch]
  );
  return (
    useFetchTeamMembers(
      teamIds,
      selectedCourseBatchId ? selectedCourseBatchId : (null as any)
    ).data ?? EMPTY
  );
};

export const useAxisBatchArchiveData = (): any[] => {
  const allowed = usePermissionStore((s) => s.selectedPermission?.allowedCourseBatcheIds);
  const selectedCourseBatchId = useSelectionsStore((s) => s.selectedCourseBatch?.id);
  return (
    useFetchAxesBatchArchives(allowed || EMPTY, selectedCourseBatchId ? selectedCourseBatchId : null)
      .data ?? EMPTY
  );
};

// Local update after a create / rename, without waiting for a refetch (was setDomains /
// setCourses on the stores). Applies to every cached list (normally one).
export const updateDomainsData = (update: (domains: Domain[]) => Domain[]) =>
  queryClient.setQueriesData<Domain[]>({ queryKey: ["domains"] }, (old: Domain[] | undefined) =>
    old ? update(old) : old
  );

export const updateCoursesData = (update: (courses: Course[]) => Course[]) =>
  queryClient.setQueriesData<Course[]>({ queryKey: ["courses"] }, (old: Course[] | undefined) =>
    old ? update(old) : old
  );
