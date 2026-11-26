// Status model of TaskUserTag (split out of TaskUserTag.tsx, issue #106).
import React from "react";
import {
  CheckCircleOutlined,
  CloseCircleOutlined,
  ClockCircleOutlined,
  ExclamationCircleOutlined,
} from "@ant-design/icons";
import { cssVar } from "../../../theme/tokens";

export interface TaskAssignment {
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

// Types pour les statuts
export type MemberStatus =
  | "NOT_ASSIGNED"
  | "ASSIGNED"
  | "DONE"
  | "APPROVED"
  | "NOTREQUIREDTOSUBMIT";

export interface StatusInfo {
  id: number | string;
  name: string;
  status: MemberStatus;
  assignmentId?: number;
}

export type StatusConfig = {
  label: string;
  color: string; // antd Tag preset color
  bgColor: string;
  borderColor: string;
  icon: React.ReactNode;
};

// Configuration des couleurs et labels pour chaque statut
export const STATUS_CONFIG: Record<MemberStatus, StatusConfig> = {
  NOT_ASSIGNED: {
    label: "לא שובצו",
    color: "red",
    bgColor: cssVar("antErrorBg"),
    borderColor: cssVar("antRed2"),
    icon: <CloseCircleOutlined />,
  },
  ASSIGNED: {
    label: "בתהליך",
    color: "orange",
    bgColor: "#fff7e6", // TODO(tokens)
    borderColor: "#ffd591", // TODO(tokens)
    icon: <ClockCircleOutlined />,
  },
  DONE: {
    label: "בוצע",
    color: "blue",
    bgColor: cssVar("antBlue1"),
    borderColor: "#91d5ff", // TODO(tokens)
    icon: <ExclamationCircleOutlined />,
  },
  APPROVED: {
    label: "מאושר",
    color: "green",
    bgColor: cssVar("antGreen1"),
    borderColor: cssVar("antGreen3"),
    icon: <CheckCircleOutlined />,
  },
  NOTREQUIREDTOSUBMIT: {
    label: "",
    color: "green",
    bgColor: cssVar("antGreen1"),
    borderColor: cssVar("antGreen3"),
    icon: <CheckCircleOutlined />,
  },
};

/** Current status of one member's assignment (same rules as before the split). */
export const getMemberStatus = (task: TaskAssignment): MemberStatus => {
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
};
