import { create } from "zustand";
import { TeamEventAssignment } from "../types/types";

interface TeamEventAssignmentsStore {
  teamEventAssignments: Partial<TeamEventAssignment>[];
  setTeamEventsAssignments: (teamEvent: Partial<TeamEventAssignment>[]) => void;
  removeTeamEventAssignment: (teamEventAssignmentId: number) => void;
}

export const useTeamEventAssignmentStore = create<TeamEventAssignmentsStore>(
  (set) => ({
    teamEventAssignments: [],
    setTeamEventsAssignments: (teamEventAssignments) => {
      return set({ teamEventAssignments });
    },
    removeTeamEventAssignment: (id: number) => {
      set((state) => ({
        teamEventAssignments: state.teamEventAssignments.filter(
          (teamEventAssignment) => teamEventAssignment.id !== id
        ),
      }));
    },
  })
);
