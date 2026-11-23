import { teamMemberKeys } from "../api/queryKeys";
import { getTeamMemberByUserIdAndTeamId } from "../services/ApiServices";

// Team member behind a STUDENT role assignment (user_id + team scope_id). Used by RoleSelect (on
// role change and on click) and useRoleNavigation: with one query key, the calls that happen at
// the same time share a single request instead of three.
// getTeamMemberByUserIdAndTeamId returns error.response on failure: only a successful response is
// a team member (the error body used to end up in selectedTeamMember).
export const studentTeamMemberQuery = (userId?: number, teamId?: number) => ({
  queryKey: teamMemberKeys.byUserAndTeam(userId, teamId),
  queryFn: async () => {
    const res: any = await getTeamMemberByUserIdAndTeamId(userId!, teamId!);
    return res && res.status < 400 && res.data ? res.data : null;
  },
  staleTime: 0, // refetch on every mount, like the former effects
});
