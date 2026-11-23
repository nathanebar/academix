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

export const teamAxisOrderKeys = {
  all: ["teamAxisOrder"] as const,
  byTeamAndBatch: (teamId: number | undefined, courseBatchId: number | undefined) =>
    [...teamAxisOrderKeys.all, teamId, courseBatchId] as const,
};

export const notebookKeys = {
  all: ["notebook"] as const,
  folders: (
    courseBatchId: number | undefined,
    teamId: number | undefined,
    teamMemberId: number | undefined
  ) => [...notebookKeys.all, "folders", courseBatchId, teamId, teamMemberId] as const,
};

export const axisTemplateKeys = {
  all: ["axisTemplate"] as const,
  byAxis: (axisId: number | undefined) => [...axisTemplateKeys.all, axisId] as const,
};

export const teamMemberKeys = {
  // the root of the existing ["teamMembers", ...] queries: their invalidations reach this one too
  all: ["teamMembers"] as const,
  byUserAndTeam: (userId: number | undefined, teamId: number | undefined) =>
    [...teamMemberKeys.all, "byUserAndTeam", userId, teamId] as const,
};

export const userKeys = {
  all: ["users"] as const,
  // rank from the people directory (PEOPLE_API on the closed network)
  rank: (username: string | undefined) => [...userKeys.all, "rank", username] as const,
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
  // tasks of a batch's teams / of one team (exceptions widget)
  bySemester: (teamIds: number[] | undefined, courseBatchId: number | undefined) =>
    [...taskKeys.all, "bySemester", teamIds, courseBatchId] as const,
  byTeam: (teamId: number | undefined, courseBatchId: number | undefined) =>
    [...taskKeys.all, "byTeam", teamId, courseBatchId] as const,
  // getTasksByUser: skipVisibility changes the response (default false, as in ApiServices)
  byUser: (
    userId: number | undefined,
    teamId: number | undefined | null,
    roleCode: string | undefined,
    courseBatchId: number | undefined,
    skipVisibility: boolean = false
  ) => [...taskKeys.all, "byUser", userId, teamId, roleCode, courseBatchId, skipVisibility] as const,
  // getTasksByUser with a date range (team member's small calendar)
  byUserInRange: (
    userId: number | undefined,
    teamId: number | undefined,
    roleCode: string | undefined,
    courseBatchId: number | undefined,
    start: string | undefined,
    end: string | undefined
  ) => [...taskKeys.all, "byUserInRange", userId, teamId, roleCode, courseBatchId, start, end] as const,
  // team member dashboard: the member's tasks (±1 year) + their queue tasks.
  // memberDashboardAll is invalidated when a task status changes (TaskUserTag).
  memberDashboardAll: () => [...taskKeys.all, "memberDashboard"] as const,
  memberDashboard: (
    teamMemberId: number | undefined,
    userId: number | undefined,
    teamId: number | undefined,
    roleCode: string | undefined,
    courseBatchId: number | undefined
  ) =>
    [...taskKeys.memberDashboardAll(), teamMemberId, userId, teamId, roleCode, courseBatchId] as const,
  // completed tasks per member of a team (team dashboard)
  completedByTeam: (teamId: number | undefined, courseBatchId: number | undefined) =>
    [...taskKeys.all, "completedByTeam", teamId, courseBatchId] as const,
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
