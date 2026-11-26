// Status chip of one member's task assignment, with a click tooltip (status pipeline + actions).
// Split in issue #106: status model in taskUserStatus.tsx, mutation + confirms in
// useTaskStatusActions.tsx, tooltip content in TaskUserTagTooltip.tsx.
import React, { useMemo } from "react";
import { CheckCircleOutlined } from "@ant-design/icons";
import { Button, Tag, Tooltip } from "antd";
import style from "./TaskTag.module.css";
import { usePermissionStore } from "../../../store/permissionStore";
import { useSelectionsStore } from "../../../store/selectionStore";
import { cssVar } from "../../../theme/tokens";
import {
  getMemberStatus,
  MemberStatus,
  STATUS_CONFIG,
  StatusInfo,
  TaskAssignment,
} from "./taskUserStatus";
import { useTaskStatusActions } from "./useTaskStatusActions";
import TaskUserTagTooltip from "./TaskUserTagTooltip";

interface TaskProps {
  task: TaskAssignment;
  size?: boolean;
  userName?: string;
}

const TaskUserTag: React.FC<TaskProps> = ({
  task,
  size,
  userName: userNameProp,
}) => {
  const { selectedPermission } = usePermissionStore();
  const taskAssId = task.task_assignment_id || task?.taskAssignmentId;

  const { selectedTeamMember } = useSelectionsStore();

  const userName = selectedTeamMember?.name || task.name || userNameProp;

  const isStudent = selectedPermission?.role_code === "STUDENT";
  const currentStatus = useMemo(
    (): MemberStatus => getMemberStatus(task),
    [task, task.assigned]
  );

  // Générer les données pour le tableau (simulé pour garder la même structure)
  const userStatusData = useMemo((): StatusInfo[] => {
    return [
      {
        id: task.id,
        name: userName || "",
        status: currentStatus,
        assignmentId: taskAssId ? Number(taskAssId) : undefined,
      },
    ];
  }, [task.id, userName, currentStatus, taskAssId]);

  const actions = useTaskStatusActions(
    taskAssId,
    userName || selectedTeamMember?.name
  );

  // Ne rien afficher si pas assigné
  if (currentStatus === "NOT_ASSIGNED") {
    return <></>;
  }

  const config = STATUS_CONFIG[currentStatus];

  return (
    <Tooltip
      title={
        config.label !== "" ? (
          <TaskUserTagTooltip
            task={task}
            currentStatus={currentStatus}
            userStatusData={userStatusData}
            selectedMemberName={selectedTeamMember?.name}
            isStudent={isStudent}
            actions={actions}
          />
        ) : (
          <span>משימה ששובצה ולא נדרשה להגשה</span>
        )
      }
      placement="topRight"
      overlayStyle={{ maxWidth: 550 }}
      trigger="click"
      destroyTooltipOnHide={{ keepParent: true }}
    >
      <div
        className={style.select}
        style={{ cursor: "pointer" }}
        onClick={(e) => {
          e.stopPropagation();
        }}
      >
        <Tag
          color={config.color}
          icon={config.icon}
          style={{
            backgroundColor: config.bgColor,
            borderColor: config.borderColor,
            fontSize: size ? 10 : 13,
            fontWeight: size ? "normal" : "600",
            height: size ? "12px" : "22px",
            lineHeight: size ? "12px" : "22px",
          }}
        >
          {config.label}
        </Tag>
        {!isStudent && config.label !== "" && (
          <div
            style={{
              marginLeft: 8,
              display: "flex",
              alignItems: "center",
            }}
          >
            {/* No own onClick: the click reaches the tooltip trigger and opens the
                status actions (#137). */}
            <Button
              type="text"
              size="small"
              icon={<CheckCircleOutlined />}
              style={{
                color: config.color === "green" ? cssVar("antGreen") : cssVar("grey999"),
              }}
            />
          </div>
        )}
      </div>
    </Tooltip>
  );
};

export default React.memo(TaskUserTag);
