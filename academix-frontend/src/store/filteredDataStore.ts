import { create } from 'zustand';
import { Axis, Course, CourseBatch, Domain, User, Team, TeamMembers } from '../types/types';


interface FilteredDataState {
  filteredDomains: Domain[];
  filteredCourses: Course[];
  filteredCourseBatches: CourseBatch[];
  filteredTeams: Team[];
  filteredAxis: Axis[];
  filteredTeamMembers: TeamMembers[]; 
  
  setFilteredDomains: (domains: Domain[]) => void;
  setFilteredCourses: (courses: Course[]) => void;
  setFilteredCourseBatches: (batches: CourseBatch[]) => void;
  setFilteredTeams: (teams: Team[]) => void;
  setFilteredAxis: (axis: Axis[]) => void;
  setFilteredTeamMembers: (teamMembers: TeamMembers[]) => void; //
}

export const useFilteredDataStore = create<FilteredDataState>((set) => ({
  filteredDomains: [],
  filteredCourses: [],
  filteredCourseBatches: [],
  filteredTeams: [],
  filteredAxis: [],
  filteredTeamMembers: [], 
  
  setFilteredDomains: (filteredDomains) => set({ filteredDomains }),
  setFilteredCourses: (filteredCourses) => set({ filteredCourses }),
  setFilteredCourseBatches: (filteredCourseBatches) => set({ filteredCourseBatches }),
  setFilteredTeams: (filteredTeams) => set({ filteredTeams }),
  setFilteredAxis: (filteredAxis) => set({ filteredAxis }),
  setFilteredTeamMembers: (filteredTeamMembers) => set({ filteredTeamMembers }), 
}));