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
};

export const teamEventKeys = {
  all: ["teamEvents"] as const,
  byTeamAndBatch: (teamId: number | undefined, courseBatchId: number | undefined) =>
    [...teamEventKeys.all, teamId, courseBatchId] as const,
};
