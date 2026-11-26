// Click-tooltip content of TaskUserTag: status header, pipeline, table and history
// (split out of TaskUserTag.tsx, issue #106).
import React from "react";
import { CheckCircleOutlined, CheckOutlined, UndoOutlined } from "@ant-design/icons";
import { Button, Space, Table, Tag } from "antd";
import { cssVar, radius } from "../../../theme/tokens";
import {
  MemberStatus,
  STATUS_CONFIG,
  StatusInfo,
  TaskAssignment,
} from "./taskUserStatus";
import { TaskStatusActions } from "./useTaskStatusActions";

type ActionButtonsProps = {
  isStudent: boolean;
  currentStatus: MemberStatus;
  actions: TaskStatusActions;
};

// Composant pour les boutons d'action
const ActionButtons: React.FC<ActionButtonsProps> = ({
  isStudent,
  currentStatus,
  actions,
}) => {
  if (isStudent) {
    return <span style={{ color: cssVar("grey999") }}>-</span>;
  }

  const buttons: React.ReactNode[] = [];

  switch (currentStatus) {
    case "NOT_ASSIGNED":
      // Pas d'actions disponibles
      break;
    case "ASSIGNED":
      buttons.push(
        <Button
          key="done"
          type="primary"
          size="small"
          icon={<CheckOutlined />}
          onClick={actions.handleMarkDone}
          style={{ backgroundColor: cssVar("antBlue"), borderColor: cssVar("antBlue") }}
        >
          סמן בוצע
        </Button>
      );
      break;
    case "DONE":
      buttons.push(
        <Button
          key="approve"
          type="primary"
          size="small"
          icon={<CheckCircleOutlined />}
          onClick={actions.handleApprove}
          style={{ backgroundColor: cssVar("antGreen"), borderColor: cssVar("antGreen") }}
        >
          אשר
        </Button>,
        <Button
          key="undo"
          danger
          size="small"
          onClick={actions.handleUndoDone}
          style={{ marginRight: 8 }}
        >
          בטל ביצוע
        </Button>
      );
      break;
    case "APPROVED":
      buttons.push(
        <Button
          key="unapprove"
          danger
          size="small"
          icon={<UndoOutlined />}
          onClick={actions.handleUnapprove}
        >
          בטל אישור
        </Button>
      );
      break;
  }

  return (
    <Space size="small" wrap>
      {buttons}
    </Space>
  );
};

type Props = {
  task: TaskAssignment;
  currentStatus: MemberStatus;
  userStatusData: StatusInfo[];
  selectedMemberName?: string;
  isStudent: boolean;
  actions: TaskStatusActions;
};

const TaskUserTagTooltip: React.FC<Props> = ({
  task,
  currentStatus,
  userStatusData,
  selectedMemberName,
  isStudent,
  actions,
}) => {
  const config = STATUS_CONFIG[currentStatus];

  // Colonnes du tableau
  const columns = [
    {
      title: "סטטוס",
      dataIndex: "status",
      key: "status",
      width: 150,
      render: (status: MemberStatus) => {
        const statusConfig = STATUS_CONFIG[status];
        return (
          <Tag
            color={statusConfig.color}
            icon={statusConfig.icon}
            style={{
              backgroundColor: statusConfig.bgColor,
              borderColor: statusConfig.borderColor,
              fontWeight: 600,
            }}
          >
            {statusConfig.label}
          </Tag>
        );
      },
    },
    {
      title: "שם החניך",
      dataIndex: "name",
      key: "name",
      render: (name: string) => (
        <span style={{ fontWeight: 500 }}>{name || selectedMemberName}</span>
      ),
    },
    {
      title: "פעולות",
      key: "actions",
      width: 200,
      render: () => (
        <ActionButtons
          isStudent={isStudent}
          currentStatus={currentStatus}
          actions={actions}
        />
      ),
    },
  ];

  return (
    <div style={{ direction: "rtl", width: 500, padding: 8 }}>
      {/* En-tête avec le statut actuel */}
      <div
        style={{
          marginBottom: 16,
          padding: 12,
          backgroundColor: config.bgColor,
          borderRadius: radius.md,
          border: `1px solid ${config.borderColor}`,
          display: "flex",
          alignItems: "center",
          gap: 12,
        }}
      >
        <Tag
          color={config.color}
          icon={config.icon}
          style={{
            fontSize: 16,
            padding: "4px 12px",
          }}
        >
          {config.label}
        </Tag>
        <span style={{ fontWeight: 500, fontSize: 16, color: cssVar("black") }}>
          {task.taskName || task.name}
        </span>
      </div>

      {/* Pipeline visuel des statuts */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          marginBottom: 16,
          padding: "8px 16px",
          backgroundColor: cssVar("antGray3"),
          borderRadius: radius.md,
        }}
      >
        {(["ASSIGNED", "DONE", "APPROVED"] as MemberStatus[]).map(
          (status, index) => {
            const statusConfig = STATUS_CONFIG[status];
            const isActive = currentStatus === status;
            const isPast =
              (currentStatus === "ASSIGNED" && status === "ASSIGNED") ||
              (currentStatus === "DONE" &&
                (status === "ASSIGNED" || status === "DONE")) ||
              currentStatus === "APPROVED";

            return (
              <React.Fragment key={status}>
                <div
                  style={{
                    textAlign: "center",
                    opacity: isPast ? 1 : 0.5,
                  }}
                >
                  <Tag
                    color={isActive ? statusConfig.color : "default"}
                    icon={statusConfig.icon}
                    style={{
                      backgroundColor: isActive
                        ? statusConfig.bgColor
                        : cssVar("antGray3"),
                      borderColor: isActive
                        ? statusConfig.borderColor
                        : cssVar("antGray5"),
                      fontWeight: isActive ? 600 : 400,
                      marginBottom: 4,
                    }}
                  >
                    {statusConfig.label}
                  </Tag>
                  {isActive && (
                    <div style={{ fontSize: 11, color: cssVar("antBlue") }}>
                      ← מצב נוכחי
                    </div>
                  )}
                </div>
                {index < 2 && (
                  <div
                    style={{
                      flex: 1,
                      height: 2,
                      backgroundColor: isPast ? cssVar("antGreen") : cssVar("antGray5"),
                      margin: "0 8px",
                      borderRadius: 1, // TODO(tokens)
                    }}
                  />
                )}
              </React.Fragment>
            );
          }
        )}
      </div>

      {/* Tableau avec le statut */}
      <Table
        dataSource={userStatusData}
        columns={columns}
        rowKey="id"
        size="small"
        pagination={false}
        scroll={{ y: 150 }}
        style={{
          backgroundColor: cssVar("white"),
          borderRadius: radius.md,
        }}
      />

      {/* Historique rapide */}
      <div
        style={{
          marginTop: 12,
          padding: 8,
          backgroundColor: "#f9f9f9", // TODO(tokens)
          borderRadius: radius.sm,
          fontSize: 12,
          color: cssVar("grey666"),
        }}
      >
        <strong>משימה:</strong> {task.name || task?.taskName}
        {task.assigned && (
          <div>
            שובץ ב: {new Date(task.assigned).toLocaleDateString("he-IL")}
          </div>
        )}
        {task.completed_at && (
          <div>
            בוצע ב: {new Date(task.completed_at).toLocaleDateString("he-IL")}
          </div>
        )}
        {task.completed && (
          <div>
            אושר ב: {new Date(task.completed).toLocaleDateString("he-IL")}
          </div>
        )}
      </div>
    </div>
  );
};

export default TaskUserTagTooltip;
