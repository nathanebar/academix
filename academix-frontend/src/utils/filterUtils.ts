import {
  Axis,
  Course,
  CourseBatch,
  FilteredDataResult,
  Team,
  Domain,
  User,
  TeamMembers,
  TeamWithBatches,
} from "../types/types";

// פילטר לצוותים - מקבל CourseBatch או id
export const filterTeamsByBatch = (
  allTeams: TeamWithBatches[],
  selectedBatchId: CourseBatch | number | null
): TeamWithBatches[] => {
  if (!selectedBatchId) return [];
  
  // חלץ את ה-ID אם זה אובייקט
  const batchId = typeof selectedBatchId === 'object' 
    ? selectedBatchId?.id 
    : selectedBatchId;
    
  if (!batchId) return [];
  
  
  return allTeams.filter((team) => {
    const hasBatch = team.courseBatches?.some(
      (link) => link.course_batch_id === batchId
    );

    return hasBatch;
  });
};

// פילטר לקורסים
export const filterCoursesBySelection = (
  allCourses: Course[],
  selectedDomainId: Domain | null
): Course[] => {  

  
  if (selectedDomainId) {
    return allCourses.filter(
      (course) => course.domainId === selectedDomainId.id
    );
  }
  return [];
};

// פילטר למחזורים
export const filterBatchesBySelection = (
  allCourseBatches: CourseBatch[],
  selectedCourseId: Course | null
): CourseBatch[] => {

  
  if (!selectedCourseId) return allCourseBatches;
  return allCourseBatches.filter(
    (batche) => batche.courseId === selectedCourseId?.id
  );
};

// פילטר לתחומים
export const filterDomains = (allDomains: Domain[]): Domain[] => {
  return allDomains;
};
// פילטר לתחומים
export const filterAxis = (
  allAxis: Axis[],
  allAxisBatchArchive: any[],
  teamId: number | null | undefined,
  courseId: string | number | undefined,
  durationCourse: number | undefined,
  start_date: Date | undefined,
  batchId: number | string | undefined
) => {

  

  if (start_date && durationCourse) {
    const startDate = new Date(start_date);
    const endDate = new Date(startDate);
    endDate.setMonth(startDate.getMonth() + durationCourse);
    return allAxis.filter((axis) => {
      if (axis?.updatedAt) {
        // אם teamId לא מוגדר או הוא null - מציג את כל הצירים של הקורס
        const axisUpdate = new Date(axis?.updatedAt);
        if ((teamId === null || teamId === undefined) && axis?.updatedAt) {
          return (
            axis?.courseId === courseId &&
            axis.team_id === null &&
            axisUpdate < endDate
          );
        }

        // אם teamId מוגדר - מציג רק צירים ששייכים לקורס או צירים ללא team_id
        return (
          axis.courseId === courseId &&
          (axis.team_id === null || axis.team_id === teamId) &&
          axisUpdate < endDate
        );
      }
    });
  } else return [];
};

// פילטר לקורסים לפי דומיין
export const filterCoursesByDomain = (
  courses: Course[],
  selectedDomain: Domain | null
): Course[] => {
  if (!selectedDomain) return courses;
  const filteredCourses = courses.filter(
    (c) => c.domainId === selectedDomain.id
  );
  return filteredCourses;
};

export const filterTeamMembers = (
  allTeamMembers: TeamMembers[],
  selectedTeamId: Team | null,
  selectedBatchId: string | number | undefined
): TeamMembers[] => {


  if (!selectedTeamId && !selectedBatchId) return [];
  
  return allTeamMembers.filter((member) => {
    const matchTeam = selectedTeamId 
      ? member.team_id == selectedTeamId.id 
      : true;
      
    const matchBatch = selectedBatchId 
      ? member.course_batch_id == selectedBatchId 
      : true;
      
    
    return matchTeam && matchBatch;
  });
};
// הפונקציה הראשית שמשלבת את כל הפילטרים
export const filterDataBySelection = (
  selectedDomainId: Domain | null,
  selectedCourseId: Course | null,
  selectedBatchId: CourseBatch | null,
  selectedTeamId: Team,
  allDomains: Domain[],
  allTeams: Team[],
  allCourses: Course[],
  allBatches: CourseBatch[],
  allAxisBatchArchive: any[],
  allAxis: Axis[],
  allTeamMembers: TeamMembers[]
): FilteredDataResult => {
  const filteredTeams = filterTeamsByBatch(allTeams, selectedBatchId);
  const filteredCourses = filterCoursesBySelection(
    allCourses,
    selectedDomainId
  );
  const filteredBatches = filterBatchesBySelection(
    allBatches,
    selectedCourseId
  );

  const filteredDomains = filterDomains(allDomains);

  const filteredAxes = filterAxis(
    allAxis,
    allAxisBatchArchive,
    selectedTeamId?.id,
    selectedCourseId?.id,
    selectedCourseId?.duration_months,
    selectedBatchId?.start_date,
    selectedBatchId?.id
  );

  const filteredTeamMembers = filterTeamMembers(allTeamMembers, selectedTeamId,selectedBatchId?.id);

  return {
    filteredDomains,
    filteredTeams,
    filteredCourses,
    filteredBatches,
    filteredAxes,
    filteredTeamMembers,
  };
};
