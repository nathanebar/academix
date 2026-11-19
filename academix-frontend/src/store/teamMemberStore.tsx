import { create } from 'zustand';
import { TeamMembers } from '../types/types';



interface TeamMembersState {
  teamMembers: TeamMembers[];
  allowTeamMembersIds: number[];
  setTeamsMembers: (teams: TeamMembers[]) => void;
}

export const useTeamMembersStore = create<TeamMembersState>((set) => ({
  teamMembers: [],
  allowTeamMembersIds: [],
  setTeamsMembers: (teamMembers) => set({ teamMembers }),
}));
