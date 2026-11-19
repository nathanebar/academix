import { usePermissionStore } from "../store/permissionStore";
import { Assignment } from "../types/types";

export const useAddPermission = () => {
  const { addPermission, removePermission, setSelectedPermission } = usePermissionStore();

  const addNewPermission = (
    permission: Assignment,
    setAsSelected: boolean = false
  ) => {
    addPermission(permission);

    if (setAsSelected) {
      setSelectedPermission(permission);
    }
  };

  const removePermissionById = (permissionId: number, clearSelected: boolean = false) => {
    removePermission(permissionId);

    // if (clearSelected) {
    //   setSelectedPermission(null);
    // }
  };

  return { addNewPermission, removePermissionById };
};