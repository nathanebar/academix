// useSelectionHandler.ts
import { useCallback } from "react";
import { filterTeamMembers } from "../utils/filterUtils";
import { useNavigate } from "react-router-dom";
import { useSelectionsStore } from "../store/selectionStore";
import { queryClient } from "../api/queryClient";

// #17: the filtered lists (courses / batches / teams of the selection) are no longer written
// here: they are derived from the selection in Layout (useFilteredData). This hook only updates
// the selection; it still uses the filters to pick the default course / batch / team.
export const useSelectionHandler = (
  courses: any[],
  courseBatches: any[],
  teams: any[],
  setSelectedDomain: (item: any) => void,
  setSelectedCourse: (item: any) => void,
  setSelectedCourseBatch: (item: any) => void,
  setSelectedTeam: (item: any) => void,
  setSelectedTeamMember: (items: any) => void,
  setShowDropdown: (show: boolean) => void,
  filterCoursesBySelection: (courses: any[], domain: any) => any[],
  filterBatchesBySelection: (batches: any[], course: any) => any[],
  filterTeamsByBatch: (teams: any[], batch: any) => any[],
  activeHeaderType?: string | null,
  setActiveHeaderType?: (type: string | null) => void
) => {
  const navigate = useNavigate();


  const handleSelectionChange = useCallback(
    (type: string, item: any) => {
      const updateCourses = (domainItem: any) => {
        const updatedCourses = filterCoursesBySelection(
          courses,
          domainItem || null
        );


        if (updatedCourses && updatedCourses.length > 0) {
       
          
          setSelectedCourse(updatedCourses[updatedCourses.length - 1]);
          return updatedCourses[updatedCourses.length - 1];
        } else {
          setSelectedCourse(null);
          setSelectedCourseBatch(null);
          setSelectedTeam(null);
          setSelectedTeamMember(null);
          return null;
        }
      };

      const updateCourseBatches = (courseItem: any) => {
        const updatedCourseBatches = filterBatchesBySelection(
          courseBatches,
          courseItem || null
        );
        if (updatedCourseBatches && updatedCourseBatches.length > 0) {
          setSelectedCourseBatch(
            updatedCourseBatches[updatedCourseBatches.length - 1]
          );
          if (setActiveHeaderType) setActiveHeaderType("courseBatches");
          return updatedCourseBatches[updatedCourseBatches.length - 1];
        } else {
          setSelectedCourseBatch(null);
          setSelectedTeam(null);
          setSelectedTeamMember(null);
          return null;
        }
      };

      const updateTeams = (batchItem: any) => {
        const updatedFilteredTeams = filterTeamsByBatch(
          teams,
          batchItem || null
        );


        if (
          updatedFilteredTeams &&
          updatedFilteredTeams.length > 0 &&
          !setActiveHeaderType
        ) {
          setSelectedTeam(updatedFilteredTeams[0]);
          return updatedFilteredTeams[0];
        } else {
          setSelectedTeam(null);
          setSelectedTeamMember(null);
          return null;
        }
      };
 /*      const updateTeamMembers = (teamItem: any) => {
  const updatedFilteredTeamMembers = filterTeamMembers(
    teamMembers,
    teamItem || null
  );
  
  setFilteredTeamMembers(updatedFilteredTeamMembers);
  if (
    updatedFilteredTeamMembers &&
    updatedFilteredTeamMembers.length > 0 &&
    !setActiveHeaderType
  ) {
    setSelectedTeamMember(updatedFilteredTeamMembers[0]);
    return updatedFilteredTeamMembers[0];
  } else {
    setSelectedTeamMember(null);
    return null;
  }
}; */

       const path = location.pathname;

    
      switch (type) {
        case "domain":
          // if( !path.includes("courseContent")){
            setSelectedDomain(item || null);
  
            const selectedCourseItem = updateCourses(item);
  
         
            
            if (selectedCourseItem) {
              const selectedBatchItem = updateCourseBatches(selectedCourseItem);
           
              
              if (selectedBatchItem) {
                updateTeams(selectedBatchItem);
              }
            }
          // }
          break;
        case "course":
          
       queryClient.refetchQueries({
                queryKey:
                ["roleAssignments",item.id],
              });

          setSelectedCourse(item || null);
          const selectedBatchItem = updateCourseBatches(item);
          if (selectedBatchItem) {
            updateTeams(selectedBatchItem);
          }
          break;
        case "courseBatches":
          setSelectedCourseBatch(item || null);
          updateTeams(item);
            setSelectedTeamMember(null);
             if (setActiveHeaderType) setActiveHeaderType("courseBatches");
          
          break;
        case "team":
          setSelectedTeam(item || null);
          setSelectedTeamMember(null);
          if (setActiveHeaderType) setActiveHeaderType("team");
          break;
        case "teamMember":
          setSelectedTeamMember(item || null);
          if (setActiveHeaderType) setActiveHeaderType("teamMember");
          break;
      }

      setShowDropdown(false);
    },
    [
      setSelectedDomain,
      setSelectedCourse,
      setSelectedCourseBatch,
      setSelectedTeam,
      setShowDropdown,
      courseBatches,
      teams,
      courses,
      setSelectedTeamMember,
      filterCoursesBySelection,
      filterBatchesBySelection,
      filterTeamsByBatch,
      filterTeamMembers,
    ]
  );

  return { handleSelectionChange };
};
