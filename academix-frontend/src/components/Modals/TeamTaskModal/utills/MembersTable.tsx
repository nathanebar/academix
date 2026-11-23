import React from "react";
import style from "../teamTaskModal.module.css";
import { Card, Table } from "antd";
import { useSelectionsStore } from "../../../../store/selectionStore";
import { feedbackType, TeamMembers, User } from "../../../../types/types";
import Photo from "../../../../UI/Photo/Photo";
import { Task } from "../../../../store/taskStore";

import { useFetchFeedbacksByCourseId } from "../../../../hooks/feedback/useFetchFeedbackByCourseId";
import { useTeamMembersData } from "../../../../hooks/useHierarchyData";
const hasUserAnswered = (
  record: any,
  task: Task | undefined,
  feedbacks: feedbackType[] | undefined,
  teamMembers: TeamMembers[] | undefined
): boolean => {
  if (!task || !feedbacks?.length) return false;

  const taskId = Number(task.id);
  const requiredFeedbackId = task.feedbackId;
  return feedbacks.some((fb) => {
    if (fb.feedbackId !== requiredFeedbackId) return false;
    return fb.answers.some((ans) => {
      if (ans.taskId !== taskId) return false;
      if (record.userId !== ans.member.user_id) return false;
      if (teamMembers) {
        const found = teamMembers.find((m) => m.user_id === record.userId);
        if (!found) return false;
      }
      return true;
    });
  });
};
type Props = { task?: Task; feedbacks: feedbackType[]; usersTask?: [] };

const MembersTable = (props: Props) => {
  const teamMembers = useTeamMembersData();
  const { selectedTeam } = useSelectionsStore();

  if (!selectedTeam) {
    return <></>;
  }

  const columns = [
    {
      title: "שם מלא",
      dataIndex: "name",
      key: "name",
      width: 250,
      render: (name: string | undefined, record: User) => (
        <div
          style={{
            height: "4vh",
            width: "10vw",
            display: "flex",
            alignItems: "center",
            justifyContent: "start",
          }}
        >
          <Photo
            username={
              /* record.militaryid ? record.militaryid :  */ record.username
            }
          />
          <span style={{ marginRight: "1vw", fontWeight: 600 }}>
            {name || record.name}
          </span>
        </div>
      ),
    },
    {
      title: "מספר אישי",
      dataIndex: "militaryid",
      key: "militaryid",
      width: 150,
      render: (username: string | undefined, record: User) => (
        <span style={{ fontWeight: 600 }}>{username || record.username}</span>
      ),
    },
    {
      title: "צוות",
      dataIndex: "militaryid",
      key: "militaryid",
      width: 150,

      render: (militaryid: string | undefined, record: User) => (
        <div>
          {" "}
          <span style={{ fontWeight: 600 }}>{selectedTeam.name}</span>
        </div>
      ),
    },

    {
      title: "סטטוס",
      dataIndex: "role",
      key: "role",
      width: 120,
      render: (role: string | undefined, record: any) => {
        const completedAll_tm_ids = props.task?.completed_all_tm_ids;
        const completed_at_only_tm_ids = props.task?.completed_at_only_tm_ids;
        const completed_only_tm_ids = props.task?.completed_only_tm_ids;
        const userId = record.userId;

        return (
          <div style={{ display: "flex", alignItems: "center" }}>
            {completedAll_tm_ids?.includes(userId) ? (
              <div style={{ color: "rgb(71,198,164)" }}>בוצע ואושר</div>
            ) : completed_at_only_tm_ids?.includes(userId) ? (
              <div style={{ color: "rgba(108, 253, 108, 1)" }}> בוצע</div>
            ) : completed_only_tm_ids?.includes(userId) ? (
              <div style={{ color: "rgba(108, 253, 108, 1)" }}> אושר</div>
            ) : (
              <div style={{ color: "rgba(252, 153, 72, 1)" }}> בתהליך</div>
            )}
          </div>
        );
      },
    },

    {
      title: "משובים",
      dataIndex: "deleteUser",
      key: "deleteUser",
      width: "8vw",
      render: (deleteUser: string | undefined, record: User) => {
        const done = hasUserAnswered(
          record,
          props.task,
          props.feedbacks,
          teamMembers
        );
        return (
          <div
            style={{
              width: "100%",
            }}
          >
            {done ? (
              <div className={style["isAnswerTagTrue"]}>בוצע</div>
            ) : (
              <div className={style["isAnswerTagFalse"]}>מחכה לתגובה למשוב</div>
            )}
          </div>
        );
      },
    },
  ];

  return (
    <div style={{ justifySelf: "center", width: "96%", direction: "ltr" }}>
      <Card>
        <Table
          sticky
          key={"id"}
          rowKey={"id"}
          size="middle"
          columns={columns.filter(
            (column) => column.title !== "משובים" || props.task?.feedbackId
          )}
          dataSource={
            props.usersTask
              ? props.usersTask
              : teamMembers
                  ?.filter(
                    (teamMember) =>
                      teamMember.team_id === selectedTeam.id &&
                      teamMember.member_role === "STUDENT"
                  )
                  ?.flatMap((teamMember) => teamMember.User)
          }
          pagination={false}
          style={{
            maxHeight: "45vh",
            overflowY: "auto",
            scrollbarWidth: "auto",
            width: "90%",
          }}
        />
      </Card>
    </div>
  );
};

export default MembersTable;
