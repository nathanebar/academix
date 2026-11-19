import { useEffect, useMemo, useState } from "react";
import {
  CheckCircleOutlined,
  CloseCircleOutlined,
  ClockCircleOutlined,
  ExclamationCircleOutlined,
  CheckOutlined,
  UndoOutlined,
} from "@ant-design/icons";
import {
  Button,
  Table,
  Tooltip,
  Tag,
  Space,
  Modal,
  message,
  Popconfirm,
} from "antd";
import type { Key } from "react";
import style from "./TaskTag.module.css";
import {
  GetAssignmentsCompletedByUser,
  TaskAssignmentsCompletedByCommander,
} from "../../../services/ApiServices";
import { queryClient } from "../../../api/queryClient";
import { usePermissionStore } from "../../../store/permissionStore";
import React from "react";
import { useMutation } from "@tanstack/react-query";
import { assign } from "lodash";
import { useTaskTeamMemberRefreshStore } from "../../../store/taskTeamMemberRefreshStore";
import { useSelectionsStore } from "../../../store/selectionStore";

interface TaskAssignment {
  id: number | string;
  name?: string | undefined;
  completed?: Date | null;
  completed_at?: Date | null;
  assigned?: Date | null;
  assignedcount?: number | null;
  totalmembers?: number | null;
  task_assignment_id?: number;
  taskAssignmentId?: number;
  has_queue_task?: boolean;
  notRequiredToSubmit?: boolean;
  taskName?: string;
}

interface TaskProps {
  task: TaskAssignment;
  size?: boolean;
  userName?: string;
}

// Types pour les statuts
type MemberStatus =
  | "NOT_ASSIGNED"
  | "ASSIGNED"
  | "DONE"
  | "APPROVED"
  | "NOTREQUIREDTOSUBMIT";

interface StatusInfo {
  id: number | string;
  name: string;
  status: MemberStatus;
  assignmentId?: number;
}

// Configuration des couleurs et labels pour chaque statut
const STATUS_CONFIG: Record<
  MemberStatus,
  {
    label: string;
    color: string;
    bgColor: string;
    borderColor: string;
    icon: React.ReactNode;
  }
> = {
  NOT_ASSIGNED: {
    label: "לא שובצו",
    color: "red",
    bgColor: "#fff2f0",
    borderColor: "#ffccc7",
    icon: <CloseCircleOutlined />,
  },
  ASSIGNED: {
    label: "בתהליך",
    color: "orange",
    bgColor: "#fff7e6",
    borderColor: "#ffd591",
    icon: <ClockCircleOutlined />,
  },
  DONE: {
    label: "בוצע",
    color: "blue",
    bgColor: "#e6f7ff",
    borderColor: "#91d5ff",
    icon: <ExclamationCircleOutlined />,
  },
  APPROVED: {
    label: "מאושר",
    color: "green",
    bgColor: "#f6ffed",
    borderColor: "#b7eb8f",
    icon: <CheckCircleOutlined />,
  },
  NOTREQUIREDTOSUBMIT: {
    label: "",
    color: "green",
    bgColor: "#f6ffed",
    borderColor: "#b7eb8f",
    icon: <CheckCircleOutlined />,
  },
};

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
  const triggerRefresh = useTaskTeamMemberRefreshStore(
    (state) => state.triggerRefresh
  );

  const currentStatus = useMemo((): MemberStatus => {
    if (task.notRequiredToSubmit && task.assigned !== null) {
      return "NOTREQUIREDTOSUBMIT";
    }
    if (task.completed_at !== null && task.completed !== null) {
      return "APPROVED";
    } else if (task.completed_at !== null) {
      return "DONE";
    } else if (
      task.assigned !== null ||
      (task.has_queue_task && task.completed_at == null)
    ) {
      return "ASSIGNED";
    }
    return "NOT_ASSIGNED";
  }, [task, task.assigned]);

  // Déterminer les statuts disponibles pour cet utilisateur
  const availableStatuses = useMemo((): MemberStatus[] => {
    const statuses: MemberStatus[] = [];

    // Statut actuel (toujours affiché)
    statuses.push(currentStatus);

    // Ajouter les statuts possibles suivants
    switch (currentStatus) {
      case "NOT_ASSIGNED":
        break;
      case "ASSIGNED":
        statuses.push("DONE");
        break;
      case "DONE":
        statuses.push("APPROVED");
        break;
      case "APPROVED":
        statuses.push("DONE"); // Peut revenir en arrière
        break;
    }

    return statuses;
  }, [currentStatus]);

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

  // Mutations
  const statusMutation = useMutation({
    mutationFn: async ({
      assignmentId,
      action,
    }: {
      assignmentId: number;
      action: string;
    }) => {
      try {
        const result = await TaskAssignmentsCompletedByCommander(
          assignmentId,
          action
        );
        return result;
      } catch (error) {
        throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["team-queue-tasks"],
      });
      queryClient.invalidateQueries({
        queryKey: ["taskCountByGradeStages"],
      });
      queryClient.invalidateQueries({
        queryKey: ["taskCountByAxis"],
      });
      queryClient.invalidateQueries({
        queryKey: ["taskGroupsToCalendar"],
      });
      queryClient.invalidateQueries({
        queryKey: ["group-tasks"],
      });
      queryClient.invalidateQueries({
        queryKey: ["tasks-range"],
      });
      queryClient.invalidateQueries({
        queryKey: ["group-tasks"],
      });

      queryClient.invalidateQueries({
        queryKey: ["hoefs"],
      });
      queryClient.invalidateQueries({
        queryKey: ["tasks-day"],
      });

      triggerRefresh();

      // Rafraîchir les données
      refetchData();
      message.success("הסטטוס עודכן בהצלחה");
    },
    onError: () => {
      message.error("שגיאה בעדכון הסטטוס");
    },
  });

  // Fonction pour recharger les données
  const refetchData = () => {
    queryClient.refetchQueries({
      queryKey: ["taskCountByGradeStages"],
    });
    queryClient.refetchQueries({
      queryKey: ["taskCountByAxis"],
    });
    queryClient.refetchQueries({
      queryKey: ["taskGroupsToCalendar"],
    });
    queryClient.refetchQueries({
      queryKey: ["group-tasks"],
    });
    queryClient.refetchQueries({
      queryKey: ["tasks-range"],
    });
  };

  // Handlers pour les actions
  const handleMarkDone = (e: any) => {
    e.stopPropagation();
    if (!taskAssId) return;
    Modal.confirm({
      title: "?לסמן כבוצע",
      content: `האם לסמן את ${userName || selectedTeamMember?.name} כביצוע?`,
      okText: "כן",
      cancelText: "ביטול",
      onOk: () => {
        statusMutation.mutate({
          assignmentId: Number(taskAssId),
          action: "complete",
        });
      },
    });
  };

  const handleUndoDone = (e: any) => {
    e.stopPropagation();
    if (!taskAssId) return;
    Modal.confirm({
      title: "?לבטל ביצוע",
      content: `האם לבטל את סימון הביצוע של ${
        userName || selectedTeamMember?.name
      }?`,
      okText: "כן",
      cancelText: "ביטול",
      onOk: () => {
        statusMutation.mutate({
          assignmentId: Number(taskAssId),
          action: "undo_complete",
        });
      },
    });
  };

  const handleApprove = (e: any) => {
    e.stopPropagation();
    if (!taskAssId) return;
    Modal.confirm({
      title: "?לאשר משימה",
      content: `האם לאשר את המשימה עבור ${
        userName || selectedTeamMember?.name
      }?`,
      okText: "כן",
      cancelText: "ביטול",
      onOk: () => {
        statusMutation.mutate({
          assignmentId: Number(taskAssId),
          action: "approve",
        });
      },
    });
  };

  const handleUnapprove = (e: any) => {
    e.stopPropagation();
    if (!taskAssId) return;
    Modal.confirm({
      title: "?לבטל אישור",
      content: `האם לבטל את האישור עבור ${
        userName || selectedTeamMember?.name
      }?`,
      okText: "כן",
      cancelText: "ביטול",
      onOk: () => {
        statusMutation.mutate({
          assignmentId: Number(taskAssId),
          action: "unapprove",
        });
      },
    });
  };

  // Composant pour les boutons d'action
  const ActionButtons: React.FC = () => {
    if (isStudent) {
      return <span style={{ color: "#999" }}>-</span>;
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
            onClick={handleMarkDone}
            style={{ backgroundColor: "#1890ff", borderColor: "#1890ff" }}
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
            onClick={handleApprove}
            style={{ backgroundColor: "#52c41a", borderColor: "#52c41a" }}
          >
            אשר
          </Button>,
          <Button
            key="undo"
            danger
            size="small"
            onClick={handleUndoDone}
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
            onClick={handleUnapprove}
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

  // Colonnes du tableau
  const columns = [
    {
      title: "סטטוס",
      dataIndex: "status",
      key: "status",
      width: 150,
      render: (status: MemberStatus) => {
        const config = STATUS_CONFIG[status];
        return (
          <Tag
            color={config.color}
            icon={config.icon}
            style={{
              backgroundColor: config.bgColor,
              borderColor: config.borderColor,
              fontWeight: 600,
            }}
          >
            {config.label}
          </Tag>
        );
      },
    },
    {
      title: "שם החניך",
      dataIndex: "name",
      key: "name",
      render: (name: string) => (
        <span style={{ fontWeight: 500 }}>
          {name || selectedTeamMember?.name}
        </span>
      ),
    },
    {
      title: "פעולות",
      key: "actions",
      width: 200,
      render: () => <ActionButtons />,
    },
  ];

  // Contenu du tooltip avec le tableau
  const renderTooltipContent = () => {
    const config = STATUS_CONFIG[currentStatus];

    return (
      <div style={{ direction: "rtl", width: 500, padding: 8 }}>
        {/* En-tête avec le statut actuel */}
        <div
          style={{
            marginBottom: 16,
            padding: 12,
            backgroundColor: config.bgColor,
            borderRadius: 8,
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
          <span style={{ fontWeight: 500, fontSize: 16, color: "black" }}>
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
            backgroundColor: "#f5f5f5",
            borderRadius: 8,
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
                          : "#f5f5f5",
                        borderColor: isActive
                          ? statusConfig.borderColor
                          : "#d9d9d9",
                        fontWeight: isActive ? 600 : 400,
                        marginBottom: 4,
                      }}
                    >
                      {statusConfig.label}
                    </Tag>
                    {isActive && (
                      <div style={{ fontSize: 11, color: "#1890ff" }}>
                        ← מצב נוכחי
                      </div>
                    )}
                  </div>
                  {index < 2 && (
                    <div
                      style={{
                        flex: 1,
                        height: 2,
                        backgroundColor: isPast ? "#52c41a" : "#d9d9d9",
                        margin: "0 8px",
                        borderRadius: 1,
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
            backgroundColor: "#fff",
            borderRadius: 8,
          }}
        />

        {/* Actions disponibles */}

        {/* אולי יחזור */}

        {/* {!isStudent && (
          <div
            style={{
              marginTop: 16,
              padding: 12,
              backgroundColor: "#fafafa",
              borderRadius: 8,
            }}
          >
            <div
              style={{
                fontWeight: "bold",
                marginBottom: 8,
                color: "#666",
              }}
            >
              פעולות זמינות:
            </div>
            <ActionButtons />
          </div>
        )} */}

        {/* Historique rapide */}
        <div
          style={{
            marginTop: 12,
            padding: 8,
            backgroundColor: "#f9f9f9",
            borderRadius: 6,
            fontSize: 12,
            color: "#666",
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

  // Rendu du composant
  const renderStatusDisplay = () => {
    const config = STATUS_CONFIG[currentStatus];

    return (
      <Tooltip
        title={
          config.label != "" ? (
            renderTooltipContent()
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
              // fontWeight: 600,
              // minWidth: '4vw',
              fontSize: size ? 10 : 13,
              fontWeight: size ? "normal" : "600",
              height: size ? "12px" : "22px",
              lineHeight: size ? "12px" : "22px",
            }}
          >
            {config.label}
          </Tag>
          {!isStudent && config.label != "" && (
            <div
              style={{
                marginLeft: 8,
                display: "flex",
                alignItems: "center",
              }}
            >
              <Button
                type="text"
                size="small"
                icon={<CheckCircleOutlined />}
                onClick={(e) => {
                  e.stopPropagation(); // עצירת propagation לכפתור
                }}
                style={{
                  color: config.color === "green" ? "#52c41a" : "#999",
                }}
              />
            </div>
          )}
        </div>
      </Tooltip>
    );
  };

  // Ne rien afficher si pas assigné
  if (currentStatus === "NOT_ASSIGNED") {
    return <></>;
  }

  return renderStatusDisplay();
};

export default TaskUserTag;

// import { CheckCircleOutlined } from "@ant-design/icons";
// import style from "./TaskTag.module.css";
// import {
//   GetAssignmentsCompletedByUser,
//   TaskAssignmentsCompletedByCommander,
// } from "../../../services/ApiServices";
// import { useEffect, useState } from "react";
// import { Tooltip } from "antd";
// import { queryClient } from "../../../api/queryClient";
// import { usePermissionStore } from "../../../store/permissionStore";

// interface TaskAssignment {
//   id: number | string;
//   name: string;
//   completed?: Date | null;
//   completed_at: Date | null;
//   assigned?: Date | null;
//   assignedcount?: number | null;
//   totalmembers?: number | null;
//   task_assignment_id?: number;
// }

// interface TaskProps {
//   task: TaskAssignment;
// }

// const TaskUserTag: React.FC<TaskProps> = ({ task }) => {
//   const [isCompleted, setIsCompleted] = useState(false);
//   const { selectedPermission, setSelectedPermission, permissions } =
//     usePermissionStore();
//   const taskAssId = task.task_assignment_id;

//   // const taskAssId =  !isCalendarPage ? Number(task.id) : Number(task?.task_id);
//   const userName = task.name;
//   useEffect(() => {
//     fetchData();
//   }, [isCompleted, taskAssId, userName, task]);

//   const fetchData = async () => {
//     if (taskAssId) {
//       const data = await GetAssignmentsCompletedByUser(taskAssId);

//       setIsCompleted(data.data.completed);
//     } else {
//       setIsCompleted(false);
//     }
//     queryClient.refetchQueries({
//       queryKey: ["taskCountByGradeStages"],
//     });
//     queryClient.refetchQueries({
//       queryKey: ["taskCountByAxis"],
//     });
//     queryClient.refetchQueries({
//       queryKey: ["taskGroupsToCalendar"],
//     });
//     queryClient.refetchQueries({
//       queryKey: ["group-tasks"],
//     });
//     queryClient.refetchQueries({
//       queryKey: ["tasks-range"],
//     });
//   };

//   const completedMission: any = async () => {
//     await TaskAssignmentsCompletedByCommander(Number(taskAssId));
//     fetchData();
//   };
//   return (
//     <div>
//       {isCompleted ? (
//         <div className={style.select}>
//           <div className={style["task-assigned-full"]}>
//             {task.completed_at !== null ? "בוצע ואושר" : "אושר"}{" "}
//           </div>
//           {selectedPermission?.role_code !== "STUDENT" && (
//             <div onClick={completedMission} style={{ marginLeft: "1.8vh" }}>
//               {/* {isCompleted ? ( */}
//               <Tooltip title="בטל אישור משימה">
//                 <CheckCircleOutlined
//                   style={{
//                     background: "rgba(119, 181, 123, 1)",
//                     color: "rgba(45, 111, 49, 1)",
//                     borderRadius: "50%",
//                   }}
//                 />
//               </Tooltip>
//             </div>
//           )}
//         </div>
//       ) : task.completed_at !== null ? (
//         <div className={style.select}>
//           <div className={style["task-assigned-full"]}>בוצע</div>
//           {selectedPermission?.role_code !== "STUDENT" && (
//             <div onClick={completedMission} style={{ marginLeft: "1.8vh" }}>
//               <Tooltip title="אשר משימה">
//                 <CheckCircleOutlined
//                   style={{
//                     background: "silver",
//                     color: "silver",
//                     border: "1px solid black",
//                     borderRadius: "50%",
//                   }}
//                 />
//               </Tooltip>
//             </div>
//           )}
//         </div>
//       ) : task.assigned !== null ? (
//         <div className={style.select}>
//           <div className={style["task-assigned-half"]}>בתהליך</div>
//           {selectedPermission?.role_code !== "STUDENT" && (
//             <div onClick={completedMission} style={{ marginLeft: "1.8vh" }}>
//               <Tooltip title="אשר משימה">
//                 <CheckCircleOutlined
//                   style={{
//                     background: "silver",
//                     color: "silver",
//                     border: "1px solid black",
//                     borderRadius: "50%",
//                   }}
//                 />
//               </Tooltip>
//             </div>
//           )}
//         </div>
//       ) : (
//         <></>
//       )}
//     </div>
//   );
// };

// export default TaskUserTag;
