// React Query key factory.
//
// Convention (RAPPORT.he.md §10.3, issue #11):
// - Every key of a feature starts with the same root, so `invalidateQueries({ queryKey: x.all })`
//   reaches all of its queries.
// - Keys hold primitive values (ids, role codes, flags) or small serializable filter objects,
//   never whole store objects (`selectedTeam`, `selectedPermission`...): an unrelated field change
//   would create a new cache entry and refetch.
// - Two different endpoints never share a key.
//
// Queries are moved here progressively: new or modified queries use this file, the others still
// use inline keys.
//
// Queries migrated from useEffect (#17) use `staleTime: 0`: they refetch on every mount, like the
// effect did, so data changed elsewhere is never shown stale while nothing invalidates their key yet.

export const feedbackKeys = {
  all: ["feedback"] as const,

  // Feedback lists of a team member. Both lists are refreshed together after a feedback is
  // submitted (previously they shared the "feedbackByUserId" key).
  memberLists: () => [...feedbackKeys.all, "member"] as const,
  byMember: (teamMemberId: number | undefined, roleCode: string | undefined) =>
    [...feedbackKeys.memberLists(), "all", teamMemberId, roleCode] as const,
  missedByMember: (teamMemberId: number | undefined) =>
    [...feedbackKeys.memberLists(), "missed", teamMemberId] as const,

  byAssignmentAll: () => [...feedbackKeys.all, "assignment"] as const,
  byAssignment: (taskAssignmentId: number | undefined, roleCode: string | undefined) =>
    [...feedbackKeys.byAssignmentAll(), taskAssignmentId, roleCode] as const,
  // under byAssignmentAll(): FeedbackForm already invalidates that prefix after a submission
  statusByAssignment: (taskAssignmentId: number | string | undefined) =>
    [...feedbackKeys.byAssignmentAll(), "status", taskAssignmentId] as const,

  openByTeam: (teamId: number | undefined, courseBatchId: number | undefined) =>
    [...feedbackKeys.all, "open", "team", teamId, courseBatchId] as const,
  openByTeams: (teamIds: number[] | undefined, courseBatchId: number | undefined) =>
    [...feedbackKeys.all, "open", "teams", teamIds, courseBatchId] as const,
};

export const axisTemplateKeys = {
  all: ["axisTemplate"] as const,
  byAxis: (axisId: number | undefined) => [...axisTemplateKeys.all, axisId] as const,
};

export const systemKeys = {
  all: ["systems"] as const,
};

export const courseBatchKeys = {
  all: ["courseBatch"] as const,
  memberCount: (courseBatchId: number) => [...courseBatchKeys.all, "memberCount", courseBatchId] as const,
};

export const taskKeys = {
  all: ["tasks"] as const,
  byUser: (
    userId: number | undefined,
    teamId: number | undefined,
    roleCode: string | undefined,
    courseBatchId: number | undefined
  ) => [...taskKeys.all, "byUser", userId, teamId, roleCode, courseBatchId] as const,
};

export const gradeStageKeys = {
  // same root as the existing ["gradeStages", userId, courseId] query, so the existing
  // invalidateQueries({ queryKey: ["gradeStages"] }) calls also refresh the progress
  all: ["gradeStages"] as const,
  progressByTeam: (teamId: number | undefined, courseBatchId: number | undefined) =>
    [...gradeStageKeys.all, "progressByTeam", teamId, courseBatchId] as const,
};

export const teamEventKeys = {
  all: ["teamEvents"] as const,
  byTeamAndBatch: (teamId: number | undefined, courseBatchId: number | undefined) =>
    [...teamEventKeys.all, teamId, courseBatchId] as const,
};
