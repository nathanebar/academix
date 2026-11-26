import { useTaskUsers } from "../../../hooks/useTaskUsers";
import { useSelectionsStore } from "../../../store/selectionStore";
import style from "./TaskTag.module.css";
import { cssVar } from "../../../theme/tokens";
import {
  Tag,
  Tooltip as AntTooltip,
  Tooltip,
  Modal,
  Button,
  Checkbox,
} from "antd";
import { useQuery } from "@tanstack/react-query";
import {
  AllTaskAssignmentsCompletedByCommander,
  GetAssignmentsCompletedByTeam,
  TaskAssignmentsCompletedByCommander,
} from "../../../services/ApiServices";
import { queryClient } from "../../../api/queryClient";
import { usePermissionStore } from "../../../store/permissionStore";

import { useFilteredData } from "../../../hooks/useFilteredData";
import { useLocation } from "react-router-dom";
import {
  filterStudentMembers,
  TeamMember,
} from "../../../utils/filterStudentMembers";
import dayjs, { Dayjs } from "dayjs";
import { useEffect, useMemo, useState } from "react";
import { CheckCircleOutlined } from "@ant-design/icons";

interface TaskAssignmentWithUser {
  id: number;
  userId: number;
  teamMemberId?: number;
  userName: string;
  username?: string;
  militaryid?: string;
  completed: Date | null;
  completed_at?: Date | null;
  start?: Date | null;
}

interface TeamMemberItem {
  id: number;
  user_id: number;
  name: string;
  militaryid?: string;
}

interface TaskAssignment {
  id: number | string;
  name?: string;
  task_assignment_id?: number[] | null;
  assignedcount?: number | null;
  totalmembers?: number | null;
  task_id?: number | string;
  completed?: Date | null;
  completed_at?: Date | null;
}

interface TaskProps {
  task: TaskAssignment;
  size?: boolean;
  fromCourseContent?: boolean;
}

const TaskTeamTag: React.FC<TaskProps> = ({
  task,
  size,
  fromCourseContent,
}) => {
  const { selectedPermission } = usePermissionStore();
  const { selectedTeam, selectedDate, selectedTeamMember } =
    useSelectionsStore();
  const { filteredTeamMembers } = useFilteredData();
  const { pathname } = useLocation();

  const isCalendarPage = pathname.includes("calendar");
  const isOnCalendarPage =
    isCalendarPage ||
    pathname.includes("missionsRepo") ||
    pathname.includes("MissionsRepo");
  const isOnCalendar = isOnCalendarPage || (task as any).isdayCalendar;

  const actualTaskId = isOnCalendar
    ? Number((task as any).task_id)
    : Number(task.id);
  const taskAssId = actualTaskId || Number(task.id);

  const allTeamMembers = useMemo(() => {
    return (
      filteredTeamMembers
        ?.filter((member: any) => member.member_role === "STUDENT")
        .map((member: any) => ({
          id: member.id,
          userId: member.user_id,
          name: member.name || member.User?.name || `User ${member.user_id}`,
        })) || []
    );
  }, [filteredTeamMembers]);

  const { data: assignedMembers = [], isLoading } = useQuery({
    queryKey: ["assignments-completed-by-team", taskAssId, selectedTeam?.id],
    queryFn: async () => {
      if (!selectedTeam?.id) throw new Error("No team selected");

      const res = await GetAssignmentsCompletedByTeam(
        Number(taskAssId),
        selectedTeam.id
      );
      return res.data || [];
    },
    enabled: !!taskAssId && !!selectedTeam?.id,
  });

  const assignedMembersDetails = useMemo(() => {
    if (pathname.includes("courseContent") || fromCourseContent) {
      return (
        assignedMembers?.map((a: TaskAssignmentWithUser) => ({
          id: a.id,
          teamMemberId: a.teamMemberId || a.id,
          userId: a.userId,
          name: a.userName || `User ${a.userId}`,
          militaryid: a.militaryid,
          completed: a.completed,
          start: a.start,
        })) || []
      );
    }

    const taskAssignmentIds: number[] = Array.isArray(task.task_assignment_id)
      ? task.task_assignment_id
      : [];

    if (taskAssignmentIds.length === 0) {
      return [];
    }

    return assignedMembers
      ?.filter((a: TaskAssignmentWithUser) => taskAssignmentIds.includes(a.id))
      .map((a: TaskAssignmentWithUser) => ({
        id: a.id,
        teamMemberId: a.teamMemberId || a.id,
        userId: a.userId,
        name: a.userName || `User ${a.userId}`,
        militaryid: a.militaryid,
        completed: a.completed,
        start: a.start,
      }));
  }, [
    assignedMembers,
    task.task_assignment_id,
    pathname,
    selectedTeamMember,
    selectedTeam,
  ]);

  const allSameDate = useMemo(() => {
    if (!assignedMembersDetails || assignedMembersDetails.length === 0) {
      return false;
    }
    const datesWithValue = assignedMembersDetails.filter((m: any) => m.start);
    if (datesWithValue.length === 0) {
      return false;
    }
    const firstDate = datesWithValue[0].start;
    return datesWithValue.every((m: any) => m.start === firstDate);
  }, [assignedMembersDetails]);

  const commonDate = useMemo(() => {
    if (!allSameDate || assignedMembersDetails.length === 0) {
      return null;
    }
    return assignedMembersDetails.find((m: any) => m.start)?.start || null;
  }, [allSameDate, assignedMembersDetails]);

  const assignedAndApproved = useMemo(() => {
    return assignedMembersDetails.filter(
      (m: { completed: Date | null }) => m.completed !== null
    );
  }, [assignedMembersDetails]);

  const assignedButNotApproved = useMemo(() => {
    return assignedMembersDetails.filter(
      (m: { completed: Date | null }) => m.completed !== null
    );
  }, [assignedMembersDetails]);

  const unassignedMembers = useMemo(() => {
    const assignedTeamMemberIds = new Set(
      assignedMembersDetails.map(
        (m: { teamMemberId: any; userId: any }) => m.teamMemberId || m.userId
      )
    );
    return allTeamMembers.filter((m: any) => {
      // const isAssigned = assignedTeamMemberIds.has(m.id);
      // return !isAssigned;

      if (assignedTeamMemberIds.has(m.id)) return false;
      if (m.member_role !== "STUDENT") return false;
      if (!selectedDate) return false;

      const createdTime = new Date(m.createdAt).valueOf();
      const updatedTime = new Date(m.updatedAt).valueOf();
      const selectedTime = selectedDate.valueOf();

      if (createdTime > selectedTime) return false;
      if (m.delete_reason) {
        return selectedTime <= updatedTime;
      }

      return true;
    });
  }, [allTeamMembers, assignedMembersDetails]);

  const [selectedMembers, setSelectedMembers] = useState<Set<number>>(
    new Set()
  );

  const handleMemberSelect = (memberId: number, checked: boolean) => {
    setSelectedMembers((prev) => {
      const newSet = new Set(prev);
      if (checked) {
        newSet.add(memberId);
      } else {
        newSet.delete(memberId);
      }
      return newSet;
    });
  };

  const handleSelectAll = () => {
    if (
      selectedMembers.size === assignedButNotApproved.length &&
      assignedButNotApproved.length > 0
    ) {
      setSelectedMembers(new Set());
    } else {
      setSelectedMembers(new Set(assignedButNotApproved.map((m: any) => m.id)));
    }
  };

  const handleApproveSelected = async () => {
    if (selectedMembers.size === 0) return;

    Modal.confirm({
      title: `? לאשר את המשימה ל${selectedMembers.size} חניכים`,
      content: `האישור ישלים את המשימה עבור ${selectedMembers.size} חניכים נבחרים`,
      okText: "כן, אשר",
      cancelText: "ביטול",
      onOk: async () => {
        const memberIds = Array.from(selectedMembers);

        const approvalPromises = memberIds.map((memberId) =>
          TaskAssignmentsCompletedByCommander(memberId)
        );

        await Promise.all(approvalPromises);

        queryClient.invalidateQueries({
          queryKey: ["assignments-completed-by-team", taskAssId],
        });
        setSelectedMembers(new Set());
      },
    });
  };

  const handleCancelApproval = async () => {
    if (assignedAndApproved.length === 0) return;

    Modal.confirm({
      title: "? לבטל את אישור המשימה של כל החניכים המאושרים",
      content: "האישור יבטל את ההשלמה של המשימה עבור כל החניכים המאושרים",
      okText: "כן, אשר",
      cancelText: "ביטול",
      onOk: async () => {
        const approvedIds = assignedAndApproved.map((m: any) => m.id);
        const cancelPromises = approvedIds.map((id: number) =>
          TaskAssignmentsCompletedByCommander(id)
        );

        await Promise.all(cancelPromises);

        queryClient.invalidateQueries({
          queryKey: ["assignments-completed-by-team", taskAssId],
        });
      },
    });
  };

  // useEffect(() => {
  //   queryClient.invalidateQueries({
  //     queryKey: ["assignments-completed-by-team"],
  //   });
  // }, [pathname]);
  function useStudentMembers(
    teamMembers: TeamMember[],
    selectedDate: Dayjs
  ): TeamMember[] {
    return useMemo(() => {
      const filtered = filterStudentMembers({ teamMembers, selectedDate });
      return filtered;
    }, [selectedDate?.valueOf()]);
  }
  const teamMembersConvert: any = useStudentMembers(
    filteredTeamMembers,
    selectedDate ?? dayjs()
  );

  const assignedCount = Number(task.assignedcount) ?? 0;
  const totalMembers = Number(teamMembersConvert.length) ?? 0;

  if (isLoading) {
    return (
      <Tooltip title="טוען...">
        <div className={style.select}>
          <div className={style["task-assigned-half"]}>טוען...</div>
        </div>
      </Tooltip>
    );
  }

  if (task.assignedcount != 0 && assignedCount === 0 && totalMembers === 0) {
    return null;
  }

  if (
    (task.assignedcount != 0 && assignedCount === totalMembers) ||
    assignedCount > totalMembers
  ) {
    return (
      <div className={style.select}>
        <Tooltip
          title={
            <div>
              כל החניכים שובצו
              {allSameDate && commonDate && <span> {" " + commonDate} </span>}
              {assignedMembersDetails.map((sol: any, index: number) => (
                <div key={index}>
                  {sol?.name || sol?.userName}
                  {!allSameDate && sol?.start && (
                    <span style={{ color: cssVar("greyAaa"), marginRight: 8 }}>
                      {" - "}
                      {sol?.start}
                    </span>
                  )}
                </div>
              ))}
            </div>
          }
        >
          <div
            style={{
              paddingLeft: 10,
              cursor: "pointer",
              fontWeight: size ? "normal" : "",
              fontSize: size ? "8px" : "12px",
            }}
            className={style["task-assigned-full"]}
          >
            כל החניכים שובצו {assignedCount}/{totalMembers}
          </div>
        </Tooltip>
      </div>
    );
  }

  if (task.assignedcount != 0 && assignedCount < totalMembers) {
    return (
      <div className={style.select}>
        <Tooltip
          title={
            <div>
              החניכים ששובצו
              {allSameDate && commonDate && <span> {" " + commonDate} </span>}
              {assignedMembersDetails?.map((sol: any, index: number) => (
                <div key={index}>
                  {sol?.name}
                  {!allSameDate && sol?.start && (
                    <span style={{ color: cssVar("greyAaa"), marginRight: 8 }}>
                      {"- "}
                      {sol?.start}
                    </span>
                  )}
                </div>
              ))}
            </div>
          }
        >
          <div
            style={{ paddingLeft: 10, cursor: "pointer" }}
            className={style["task-assigned-half"]}
          >
            חניכים ששובצו {assignedCount}/{totalMembers}
          </div>
        </Tooltip>
      </div>
    );
  }

  return null;
};

export default TaskTeamTag;
