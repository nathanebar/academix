import { useSelectionsStore } from "../store/selectionStore";
import { usePermissionStore } from "../store/permissionStore";

export const useItemLockStatus = () => {
  const { activeHeaderType, selectedTeam } = useSelectionsStore();
  const { selectedPermission } = usePermissionStore();

  const isTeamCommander = selectedPermission?.role_code === "TEAM_COMMANDER" || selectedPermission?.role_code === "OVERLAP";

  
  const isLocked = (itemTeamId: number | null): boolean => {
    if (itemTeamId === null && isTeamCommander) {
      return true;
    }
    return false;
  };

  const isCreatedByCurrentTeam = (itemTeamId: number | null): boolean => {
    if (itemTeamId === selectedTeam?.id) {
      return true;
    }
    return false;
  };

  const getIndicatorType = (
    itemTeamId: number | null
  ): "lock" | "team" | "manager" => {
    if (isLocked(itemTeamId)) {
      return "manager";
    }
    if (isCreatedByCurrentTeam(itemTeamId)) {
      return "team";
    }
    return "manager";
  };

  return {
    isLocked,
    isCreatedByCurrentTeam,
    getIndicatorType,
    isTeamCommander,
  };
};