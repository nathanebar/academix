import { create } from 'zustand';

type Role = {
  code: string;
  name_he: string;
  name_en: string;
};

type RoleState = {
  roles: Role[];
  setRoles: (role: Role[]) => void;
};

export const useRoleStore = create <RoleState> ((set)=>({
    roles:[],
    setRoles: (roles)=> set({roles})
}))