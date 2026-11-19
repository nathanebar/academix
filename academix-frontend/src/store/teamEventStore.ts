import { create } from "zustand";
import { TeamEvent } from "../types/types";
import { useTeamEvent } from "../hooks/useTeamEvent";
interface TeamEventsStore {
  teamEvents: Partial<TeamEvent>[];
  setTeamEvents: (teamEvent: Partial<TeamEvent>[]) => void;
}

export const useTeamEventStore = create<TeamEventsStore>((set) => ({
  teamEvents: [],
  setTeamEvents: (teamEvents) => {
    return set({ teamEvents });
  },
}));
