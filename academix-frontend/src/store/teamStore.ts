import { create } from 'zustand';

interface Team {
  id: number ;
  name: string;
  course_batch_id: string | number;
}


interface TeamStoreState {
  teams: Team[];
  allowTeamIds: number[];
  setTeams: (teams: Team[]) => void;
  setAllowTeamIds: (teamIds: number[]) => void;
  addAllowTeamId: (teamId: number) => void;
  removeAllowTeamId: (teamId: number) => void;
}

export const useTeamStore = create<TeamStoreState>((set) => ({
  teams: [],
  allowTeamIds: [],
  setTeams: (teams) => set({ teams }),
  setAllowTeamIds: (teamIds) => set({ allowTeamIds: teamIds }),
  addAllowTeamId: (teamId) => set((state) => ({
    allowTeamIds: [...state.allowTeamIds, teamId]
  })),
  removeAllowTeamId: (teamId) => set((state) => ({
    allowTeamIds: state.allowTeamIds.filter(id => id !== teamId)
  })),
}));
