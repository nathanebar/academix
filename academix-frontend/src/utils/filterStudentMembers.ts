import { Dayjs } from "dayjs";

export interface TeamMember {
   id: number;
  team_id: number;
  user_id: number;
  member_role: string;
  Team?: any;
  User?: any;
  name?: string ;
  delete_reason?: null | string;
  basicCourse?: string | null;
  course_batch_id?: string | number | undefined;
}

export interface FilterStudentMembersParams {
  teamMembers: TeamMember[];
  selectedDate: Dayjs ;
   selectedTeamId?: number;
  selectedCourseBatchId?: number;
}


export function filterStudentMembers({
  teamMembers,
  selectedDate,
    selectedTeamId,
  selectedCourseBatchId,
}: FilterStudentMembersParams): TeamMember[] {
  if (!selectedDate) return [];

  const selectedTime = selectedDate.valueOf();

  return teamMembers.filter((tm:any) => {
    if (tm.member_role !== "STUDENT") return false;

      if (selectedTeamId && tm.team_id !== selectedTeamId) return false;
    
    // סינון לפי מחזור נבחר
    if (selectedCourseBatchId && tm.course_batch_id !== selectedCourseBatchId) return false;

    const createdTime = new Date(tm.createdAt).valueOf();
    // if (createdTime > selectedTime) return false;
    if (tm.delete_reason) {
      const updatedTime = new Date(tm.updatedAt).valueOf();
      return selectedTime <= updatedTime;
    }
    return true;
  });
}