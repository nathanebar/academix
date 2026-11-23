import { useEffect, useMemo, useState } from "react";
import {
  CheckCircleOutlined,
  CloseCircleOutlined,
  ClockCircleOutlined,
  ExclamationCircleOutlined,
  CheckOutlined,
  UndoOutlined,
  UserAddOutlined,
  DeleteOutlined,
} from "@ant-design/icons";
import {
  Button,
  Table,
  Tooltip,
  Tag,
  Space,
  Modal,
  message,
  Checkbox,
  Popconfirm,
  TimePicker,
  DatePicker,
} from "antd";
import type { Key } from "react";
// import style from "./TaskTag.module.css";
import { useQuery, useMutation } from "@tanstack/react-query";
import {
  assignToUser,
  GetAssignmentsCompletedByTeam,
  TaskAssignmentsCompletedByCommander,
} from "../../../services/ApiServices";
import { queryClient } from "../../../api/queryClient";
import { useFilteredData } from "../../../hooks/useFilteredData";
import { useLocation } from "react-router-dom";
import { useSelectionsStore } from "../../../store/selectionStore";
import dayjs, { Dayjs } from "dayjs";
import { useCourseBatchesData } from "../../../hooks/useHierarchyData";

interface TaskAssignmentWithUser {
  id: number;
  userId: number;
  teamMemberId?: number;
  userName: string;
  username?: string;
  militaryid?: string;
  completed: Date | null;
  completed_at?: Date | null;
  approved?: boolean;
  approved_at?: Date | null;
}

interface TaskAssignment {
  id: number | string;
  name: string;
  assignedcount?: number | null;
  totalmembers?: number | null;
  task_id?: number | string;
}

interface TaskProps {
  task: TaskAssignment;
  openModal: boolean;
  setOpenModal: React.Dispatch<React.SetStateAction<boolean>>;
  setSelectedEvent: React.Dispatch<React.SetStateAction<any>>;
}

interface AssignmentModalState {
  open: boolean;
  member: MemberWithStatus | null;
  startDate: Dayjs | null;
  endDate: Dayjs | null;
  startTime: Dayjs | null;
  endTime: Dayjs | null;
}

type MemberStatus = "NOT_ASSIGNED" | "ASSIGNED" | "DONE" | "APPROVED";

interface MemberWithStatus {
  id: number;
  teamMemberId: number;
  userId: number;
  name: string;
  militaryid?: string;
  status: MemberStatus;
  completed?: Date | null;
  assignmentId?: number;
}

const STATUS_CONFIG = {
  NOT_ASSIGNED: {
    label: "לא שובצו",
    color: "red",
    bgColor: "#fff2f0",
    borderColor: "#ffccc7",
    icon: <CloseCircleOutlined />,
  },
  ASSIGNED: {
    label: "שובצו",
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
};

const TaskMembersStatus: React.FC<TaskProps> = ({
  task,
  openModal,
  setOpenModal,
  setSelectedEvent,
}) => {
  const { filteredTeamMembers } = useFilteredData();
  const { selectedTeam, selectedDate } = useSelectionsStore();
  const { pathname } = useLocation();
  const [selectedRowKeys, setSelectedRowKeys] = useState<React.Key[]>([]); 
  const [assignmentModal, setAssignmentModal] = useState<AssignmentModalState>({
  open: false,
  member: null,
  startDate: null,
  endDate: null,
  startTime: null,
  endTime: null,
  });
  const isCalendarPage = pathname.includes("calendar");
  const courseBatches = useCourseBatchesData();
  const isOnCalendarPage =
    isCalendarPage ||
    pathname.includes("missionsRepo") ||
    pathname.includes("MissionsRepo");
  const isOnCalendar = isOnCalendarPage || (task as any).isdayCalendar;
  const actualTaskId = isOnCalendar
    ? Number((task as any)?.task_id)
    : Number(task?.id);
  const taskAssId = actualTaskId || Number(task?.id);

  const allTeamMembers = useMemo(() => {
    return (
      filteredTeamMembers
        ?.filter((member: any) => member.member_role === "STUDENT" && member.delete_reason === null)
        .map((member: any) => ({
          id: member.id,
          userId: member.user_id,
          name: member.name || member.User?.name || `User ${member.user_id}`,
        })) || []
    );
  }, [filteredTeamMembers]);

  const { data: assignedMembers = [], isLoading } = useQuery({
    queryKey: ["assignments-completed-by-team", taskAssId],
    queryFn: async () => {
      const res = await GetAssignmentsCompletedByTeam(
        Number(taskAssId),
        selectedTeam?.id
      );
      return res.data || [];
    },
    enabled: !!taskAssId,
  });

  useEffect(() => {
    queryClient.invalidateQueries({
      queryKey: ["assignments-completed-by-team", taskAssId],
    });
  }, [assignedMembers, taskAssId, queryClient]);

  const membersWithStatus = useMemo((): MemberWithStatus[] => {
    const assignedMap = new Map<number, TaskAssignmentWithUser>();

    assignedMembers.forEach((a: TaskAssignmentWithUser) => {
      const memberId = a.teamMemberId || a.id;
      assignedMap.set(memberId, a);
    });

    const result: MemberWithStatus[] = [];

    assignedMembers.forEach((a: TaskAssignmentWithUser) => {
      const teamMemberId = a.teamMemberId || a.id;
      let status: MemberStatus;

      if (a.completed && a.completed_at) {
        status = "APPROVED";
      } else if (a.completed_at) {
        status = "DONE";
      } else {
        status = "ASSIGNED";
      }

      result.push({
        id: a.id,
        teamMemberId,
        userId: a.userId,
        name: a.userName || `User ${a.userId}`,
        militaryid: a.militaryid,
        status,
        completed: a.completed,
        assignmentId: a.id,
      });
    });

    allTeamMembers.forEach((member) => {
      if (!assignedMap.has(member.id)) {
        result.push({
          id: 0,
          teamMemberId: member.id,
          userId: member.userId,
          name: member.name,
          status: "NOT_ASSIGNED",
        });
      }
    });

    const statusOrder: Record<MemberStatus, number> = {
      NOT_ASSIGNED: 0,
      ASSIGNED: 1,
      DONE: 2,
      APPROVED: 3,
    };

    return result.sort((a, b) => statusOrder[a.status] - statusOrder[b.status]);
  }, [assignedMembers, allTeamMembers]);

  const membersByStatus = useMemo(() => {
    const grouped: Record<MemberStatus, MemberWithStatus[]> = {
      NOT_ASSIGNED: [],
      ASSIGNED: [],
      DONE: [],
      APPROVED: [],
    };

    membersWithStatus.forEach((member) => {
      grouped[member.status].push(member);
    });

    return grouped;
  }, [membersWithStatus]);

  const selectedMembers = useMemo(() => {
    return membersWithStatus.filter((m) =>
      selectedRowKeys.includes(`${m.status}-${m.teamMemberId}`)
    );
  }, [selectedRowKeys, membersWithStatus]);

  const selectedByStatus = useMemo(() => {
    const grouped: Record<MemberStatus, MemberWithStatus[]> = {
      NOT_ASSIGNED: [],
      ASSIGNED: [],
      DONE: [],
      APPROVED: [],
    };

    selectedMembers.forEach((member) => {
      if (member.status !== "NOT_ASSIGNED") {
        grouped[member.status].push(member);
      }
    });

    return grouped;
  }, [selectedMembers]);
  const assignMutation = useMutation({
  mutationFn: async ({
    memberId,
    start,
    end,
  }: {
    memberId: number;
    start: Date;
    end: Date;
  }) => {
    return assignToUser(
      Number(taskAssId),
      selectedTeam?.id,
      memberId,
      start,
      end,
      Number(courseBatches[0]?.id) || 0
    );
  },
  onSuccess: () => {
  
    

    queryClient.invalidateQueries({
      queryKey: ["assignments-completed-by-team", taskAssId,selectedTeam?.id],
    });
    queryClient.invalidateQueries({
      queryKey: ["tasks-range"],
    });
    message.success("המשימה שובצה בהצלחה");

    handleClose()
    setAssignmentModal({
      open: false,
      member: null,
      startDate: null,
      endDate: null,
      startTime: null,
      endTime: null,
    });
  },
  onError: () => {
    message.error("שגיאה בשיבוץ המשימה");
  },
});
  // Mutations
  const statusMutation = useMutation({
    mutationFn: async ({
      assignmentIds,
      action,
    }: {
      assignmentIds: number[];
      action: string;
    }) => {
      const promises = assignmentIds.map((id) =>
        TaskAssignmentsCompletedByCommander(id, action)
      );
      return Promise.all(promises);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["assignments-completed-by-team", taskAssId],
      });
      message.success("הסטטוס עודכן בהצלחה");
      setSelectedRowKeys([]);
    },
    onError: () => {
      message.error("שגיאה בעדכון הסטטוס");
    },
  });

  const handleMarkDone = (member: MemberWithStatus) => {
    if (!member.assignmentId) return;
    Modal.confirm({
      title: "?לסמן כבוצע",
      content: `האם לסמן את ${member.name} כביצוע?`,
      okText: "כן",
      cancelText: "ביטול",
      onOk: () => {
        statusMutation.mutate({
          assignmentIds: [member.assignmentId ?? -1],
          action: "complete",
        });
      },
    });
  };

  const handleUndoDone = (member: MemberWithStatus) => {
    if (!member.assignmentId) return;
    Modal.confirm({
      title: "?לבטל ביצוע",
      content: `האם לבטל את סימון הביצוע של ${member.name}?`,
      okText: "כן",
      cancelText: "ביטול",
      onOk: () => {
        statusMutation.mutate({
          assignmentIds: [member.assignmentId ?? -1],
          action: "undo_complete",
        });
      },
    });
  };

  const handleApprove = (member: MemberWithStatus) => {
    if (!member.assignmentId) return;
    Modal.confirm({
      title: "?לאשר משימה",
      content: `האם לאשר את המשימה עבור ${member.name}?`,
      okText: "כן",
      cancelText: "ביטול",
      onOk: () => {
        statusMutation.mutate({
          assignmentIds: [member.assignmentId ?? -1],
          action: "approve",
        });
      },
    });
  };

  const handleUnapprove = (member: MemberWithStatus) => {
    if (!member.assignmentId) return;
    Modal.confirm({
      title: "?לבטל אישור",
      content: `האם לבטל את האישור עבור ${member.name}?`,
      okText: "כן",
      cancelText: "ביטול",
      onOk: () => {
        statusMutation.mutate({
          assignmentIds: [member.assignmentId ?? -1],
          action: "unapprove",
        });
      },
    });
  };

  // Handlers pour actions bulk
  const handleBulkMarkDone = () => {
    const assignmentIds = selectedByStatus.ASSIGNED.map(
      (m) => m.assignmentId
    ).filter((id): id is number => id !== undefined);

    if (assignmentIds.length === 0) {
      message.warning("אין חניכים בסטטוס 'שובצו' שנבחרו");
      return;
    }

    Modal.confirm({
      title: "?לסמן כבוצע",
      content: `האם לסמן ${assignmentIds.length} חניכים כביצוע?`,
      okText: "כן",
      cancelText: "ביטול",
      onOk: () => {
        statusMutation.mutate({ assignmentIds, action: "complete" });
      },
    });
  };

  const handleBulkApprove = () => {
    const assignmentIds = selectedByStatus.DONE.map(
      (m) => m.assignmentId
    ).filter((id): id is number => id !== undefined);

    if (assignmentIds.length === 0) {
      message.warning("אין חניכים בסטטוס 'בוצע' שנבחרו");
      return;
    }

    Modal.confirm({
      title: "?לאשר משימות",
      content: `האם לאשר את המשימה עבור ${assignmentIds.length} חניכים?`,
      okText: "כן",
      cancelText: "ביטול",
      onOk: () => {
        statusMutation.mutate({ assignmentIds, action: "approve" });
      },
    });
  };

  const handleBulkUndoDone = () => {
    const assignmentIds = selectedByStatus.DONE.map(
      (m) => m.assignmentId
    ).filter((id): id is number => id !== undefined);

    if (assignmentIds.length === 0) {
      message.warning("אין חניכים בסטטוס 'בוצע' שנבחרו");
      return;
    }

    Modal.confirm({
      title: "?לבטל ביצוע",
      content: `האם לבטל את סימון הביצוע עבור ${assignmentIds.length} חניכים?`,
      okText: "כן",
      cancelText: "ביטול",
      onOk: () => {
        statusMutation.mutate({ assignmentIds, action: "undo_complete" });
      },
    });
  };

  const handleBulkUnapprove = () => {
    const assignmentIds = selectedByStatus.APPROVED.map(
      (m) => m.assignmentId
    ).filter((id): id is number => id !== undefined);

    if (assignmentIds.length === 0) {
      message.warning("אין חניכים בסטטוס 'מאושר' שנבחרו");
      return;
    }

    Modal.confirm({
      title: "?לבטל אישור",
      content: `האם לבטל את האישור עבור ${assignmentIds.length} חניכים?`,
      okText: "כן",
      cancelText: "ביטול",
      onOk: () => {
        statusMutation.mutate({ assignmentIds, action: "unapprove" });
      },
    });
  };

  const handleClearSelection = () => {
    setSelectedRowKeys([]);
  };

  const handleSelectAllInStatus = (status: MemberStatus, checked: boolean) => {
    const membersInStatus: Key[] = membersByStatus[status]
      .filter((m) => m.status !== "NOT_ASSIGNED")
      .map((m) => `${m.status}-${m.teamMemberId}` as Key);

    if (checked) {
      setSelectedRowKeys((prev) => {
        const newKeys = new Set<React.Key>(prev);
        membersInStatus.forEach((key) => newKeys.add(key));
        return Array.from(newKeys);
      });
    } else {
      setSelectedRowKeys((prev) =>
        prev.filter((key) => !membersInStatus.includes(key))
      );
    }
  };

  const isAllSelectedInStatus = (status: MemberStatus) => {
    const membersInStatus = membersByStatus[status].filter(
      (m) => m.status !== "NOT_ASSIGNED"
    );
    if (membersInStatus.length === 0) return false;
    const selectedKeys = new Set<React.Key>(selectedRowKeys);
    return membersInStatus.every((m) =>
      selectedKeys.has(`${m.status}-${m.teamMemberId}` as React.Key)
    );
  };

  const isSomeSelectedInStatus = (status: MemberStatus) => {
    const membersInStatus = membersByStatus[status].filter(
      (m) => m.status !== "NOT_ASSIGNED"
    );
    if (membersInStatus.length === 0) return false;
    const selectedKeys = new Set<React.Key>(selectedRowKeys);
    const selectedCount = membersInStatus.filter((m) =>
      selectedKeys.has(`${m.status}-${m.teamMemberId}` as React.Key)
    ).length;
    return selectedCount > 0 && selectedCount < membersInStatus.length;
  };
  const handleOpenAssignmentModal = (member: MemberWithStatus) => {
  const eventStart = (task as any)?.start;
  const eventEnd = (task as any)?.end;
  
  const defaultStart = eventStart ? dayjs(eventStart) : dayjs();
  const defaultEnd = eventEnd ? dayjs(eventEnd) : dayjs().add(1, "hour");
   setAssignmentModal({
    open: true,
    member,
    startDate: defaultStart,
    endDate: defaultEnd,
    startTime: defaultStart,
    endTime: defaultEnd,
  });
};

const handleCloseAssignmentModal = () => {
  setAssignmentModal({
    open: false,
    member: null,
    startDate: null,
    endDate: null,
    startTime: null,
    endTime: null,
  });
};

const handleConfirmAssignment = () => {
  const { member, startDate, startTime, endDate, endTime } = assignmentModal;
  if (!member) return;
  if (!startDate || !startTime || !endDate || !endTime) {
    message.warning("נא למלא את כל השדות");
    return;
  }
  const startDateTime = startDate
    .hour(startTime.hour())
    .minute(startTime.minute())
    .second(0)
    .toDate();
  const endDateTime = endDate
    .hour(endTime.hour())
    .minute(endTime.minute())
    .second(0)
    .toDate();
  assignMutation.mutate({
    memberId: member.teamMemberId,
    start: startDateTime,
    end: endDateTime,
  });
};
  const ActionButtons: React.FC<{ member: MemberWithStatus }> = ({
    member,
  }) => {
    const buttons: React.ReactNode[] = [];

    switch (member.status) {
      case "NOT_ASSIGNED":
        buttons.push(
          <Button
      key="assign"
      type="primary"
      size="small"
      icon={<UserAddOutlined />}
      onClick={() => handleOpenAssignmentModal(member)}
    >
      שבץ למשימה
    </Button>
        );
        break;
      case "ASSIGNED":
        buttons.push(
          <Button
            key="done"
            type="primary"
            size="small"
            icon={<CheckOutlined />}
            onClick={() => handleMarkDone(member)}
            style={{ backgroundColor: "#1890ff", borderColor: "#1890ff" }}
          >
            סמן בוצע ואושר
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
            onClick={() => handleApprove(member)}
            style={{ backgroundColor: "#52c41a", borderColor: "#52c41a" }}
          >
            אשר
          </Button>,
          <Button
            key="undo"
            danger
            size="small"
            onClick={() => handleUndoDone(member)}
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
            onClick={() => handleUnapprove(member)}
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

  const columns = [
    {
      title: "",
      dataIndex: "selection",
      key: "selection",
      width: 50,
      render: (_: any, record: MemberWithStatus) => (
        <Checkbox
          checked={selectedRowKeys.includes(
            `${record.status}-${record.teamMemberId}`
          )}
          onChange={(e) => {
            const key = `${record.status}-${record.teamMemberId}`;
            if (e.target.checked) {
              setSelectedRowKeys((prev) => [...prev, key]);
            } else {
              setSelectedRowKeys((prev) => prev.filter((k) => k !== key));
            }
          }}
          disabled={record.status === "NOT_ASSIGNED"}
        />
      ),
    },
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
      filters: [
        { text: "לא שובצו", value: "NOT_ASSIGNED" },
        { text: "שובצו", value: "ASSIGNED" },
        { text: "בוצע", value: "DONE" },
        { text: "מאושר", value: "APPROVED" },
      ],
      onFilter: (value: any, record: MemberWithStatus) =>
        record.status === value,
    },
    {
      title: "שם החניך",
      dataIndex: "name",
      key: "name",
      render: (name: string, record: MemberWithStatus) => (
        <Space direction="vertical" size={0}>
          <span style={{ fontWeight: 500 }}>{name}</span>
          {record.militaryid && (
            <span style={{ fontSize: 12, color: "#999" }}>
              {record.militaryid}
            </span>
          )}
        </Space>
      ),
    },
    {
      title: "פעולות",
      key: "actions",
      width: 200,
      render: (_: any, record: MemberWithStatus) => (
        <ActionButtons member={record} />
      ),
    },
  ];

  const summary = {
    total: membersWithStatus.length,
    notAssigned: membersByStatus.NOT_ASSIGNED.length,
    assigned: membersByStatus.ASSIGNED.length,
    done: membersByStatus.DONE.length,
    approved: membersByStatus.APPROVED.length,
  };

  const selectedCount = selectedMembers.length;
  const hasSelectedAssignable = selectedByStatus.ASSIGNED.length > 0;
  const hasSelectedDone = selectedByStatus.DONE.length > 0;
  const hasSelectedApproved = selectedByStatus.APPROVED.length > 0;
  const handleClose: () => void = () => {
    setOpenModal(false);
    setSelectedEvent(null);
  };

  return (
     <>
    <Modal
      open={openModal}
      onCancel={handleClose}
      width={630}
      style={{ direction: "rtl", width: 950 }}
      footer={null}
    >
      <div
        style={{
          display: "flex",
          gap: 12,
          marginBottom: 16,
          padding: 12,
          backgroundColor: "#f5f5f5",
          borderRadius: 8,
        }}
      >
        <div style={{ textAlign: "center" }}>
          <div style={{ fontSize: 20, fontWeight: "bold", color: "#1890ff" }}>
            {summary.total}
          </div>
          <div style={{ fontSize: 12, color: "#666" }}>סה"כ חניכים</div>
        </div>
        <div style={{ textAlign: "center" }}>
          <div style={{ fontSize: 20, fontWeight: "bold", color: "#52c41a" }}>
            {summary.approved}
          </div>
          <div style={{ fontSize: 12, color: "#666" }}>מאושרים</div>
        </div>
        <div style={{ textAlign: "center" }}>
          <div style={{ fontSize: 20, fontWeight: "bold", color: "#1890ff" }}>
            {summary.done}
          </div>
          <div style={{ fontSize: 12, color: "#666" }}>בוצעו</div>
        </div>
        <div style={{ textAlign: "center" }}>
          <div style={{ fontSize: 20, fontWeight: "bold", color: "#fa8c16" }}>
            {summary.assigned}
          </div>
          <div style={{ fontSize: 12, color: "#666" }}>שובצו</div>
        </div>
        <div style={{ textAlign: "center" }}>
          <div style={{ fontSize: 20, fontWeight: "bold", color: "#ff4d4f" }}>
            {summary.notAssigned}
          </div>
          <div style={{ fontSize: 12, color: "#666" }}>לא שובצו</div>
        </div>
      </div>

      <div
        style={{
          display: "flex",
          gap: 8,
          marginBottom: 12,
          padding: "8px 12px",
          backgroundColor: "#e6f7ff",
          borderRadius: 8,
          flexWrap: "wrap",
        }}
      >
        {(["ASSIGNED", "DONE", "APPROVED"] as MemberStatus[]).map((status) => {
          const config = STATUS_CONFIG[status];
          const count = membersByStatus[status].length;
          const isAll = isAllSelectedInStatus(status);
          const isSome = isSomeSelectedInStatus(status);

          return (
            <Checkbox
              key={status}
              indeterminate={isSome}
              checked={isAll}
              onChange={(e) =>
                handleSelectAllInStatus(status, e.target.checked)
              }
              disabled={count === 0}
              style={{ display: "flex", alignItems: "center", gap: 4 }}
            >
              <Tag
                color={config.color}
                style={{ margin: 0, cursor: "pointer" }}
              >
                {config.label} ({count})
              </Tag>
            </Checkbox>
          );
        })}
      </div>

      <Table
        dataSource={membersWithStatus}
        columns={columns}
        rowKey={(record: MemberWithStatus) =>
          `${record.status}-${record.teamMemberId}`
        }
        size="small"
        pagination={false}
        scroll={{ y: 300 }}
        locale={{
          emptyText: "אין חניכים בצוות זה",
          filterConfirm: "אישור",
          filterReset: "איפוס",
          filterTitle: "סינון",
        }}
        style={{
          backgroundColor: "#fff",
          borderRadius: 8,
        }}
      />

      {selectedCount > 0 && (
        <div
          style={{
            marginTop: 16,
            padding: 16,
            backgroundColor: "#f6ffed",
            borderRadius: 8,
            border: "1px solid #b7eb8f",
          }}
        >
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              marginBottom: 12,
            }}
          >
            <span style={{ fontWeight: "bold", color: "#52c41a" }}>
              {selectedCount} חניכים נבחרו
            </span>
            <Button size="small" onClick={handleClearSelection}>
              נקה בחירה
            </Button>
          </div>

          <div
            style={{
              display: "flex",
              gap: 8,
              flexWrap: "wrap",
            }}
          >
            {hasSelectedAssignable && (
              <Button
                type="primary"
                size="small"
                icon={<CheckOutlined />}
                onClick={handleBulkMarkDone}
                style={{ backgroundColor: "#1890ff", borderColor: "#1890ff" }}
              >
                סמן כבוצע ({selectedByStatus.ASSIGNED.length})
              </Button>
            )}
            {hasSelectedDone && (
              <>
                <Button
                  type="primary"
                  size="small"
                  icon={<CheckCircleOutlined />}
                  onClick={handleBulkApprove}
                  style={{
                    backgroundColor: "#52c41a",
                    borderColor: "#52c41a",
                  }}
                >
                  אשר ({selectedByStatus.DONE.length})
                </Button>
                <Button
                  danger
                  size="small"
                  icon={<UndoOutlined />}
                  onClick={handleBulkUndoDone}
                >
                  בטל ביצוע ({selectedByStatus.DONE.length})
                </Button>
              </>
            )}
            {hasSelectedApproved && (
              <Button
                danger
                size="small"
                icon={<UndoOutlined />}
                onClick={handleBulkUnapprove}
              >
                בטל אישור ({selectedByStatus.APPROVED.length})
              </Button>
            )}
          </div>

          {selectedCount > 0 && (
            <div style={{ marginTop: 12, fontSize: 12, color: "#666" }}>
              {selectedByStatus.ASSIGNED.length > 0 && (
                <div style={{ marginBottom: 4 }}>
                  <Tag color="orange">
                    שובצו: {selectedByStatus.ASSIGNED.length}
                  </Tag>
                  {selectedByStatus.ASSIGNED.slice(0, 3)
                    .map((m) => m.name)
                    .join(", ")}
                  {selectedByStatus.ASSIGNED.length > 3 &&
                    ` ועוד ${selectedByStatus.ASSIGNED.length - 3}`}
                </div>
              )}
              {selectedByStatus.DONE.length > 0 && (
                <div style={{ marginBottom: 4 }}>
                  <Tag color="blue">בוצע: {selectedByStatus.DONE.length}</Tag>
                  {selectedByStatus.DONE.slice(0, 3)
                    .map((m) => m.name)
                    .join(", ")}
                  {selectedByStatus.DONE.length > 3 &&
                    ` ועוד ${selectedByStatus.DONE.length - 3}`}
                </div>
              )}
              {selectedByStatus.APPROVED.length > 0 && (
                <div>
                  <Tag color="green">
                    מאושר: {selectedByStatus.APPROVED.length}
                  </Tag>
                  {selectedByStatus.APPROVED.slice(0, 3)
                    .map((m) => m.name)
                    .join(", ")}
                  {selectedByStatus.APPROVED.length > 3 &&
                    ` ועוד ${selectedByStatus.APPROVED.length - 3}`}
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </Modal>
      <Modal
        title="שבץ למשימה"
        open={assignmentModal.open}
        onCancel={handleCloseAssignmentModal}
        onOk={handleConfirmAssignment}
        okText="אישור"
        cancelText="ביטול"
        confirmLoading={assignMutation.isPending}
        width={500}
        style={{ direction: "rtl" }}
      >
        {assignmentModal.member && (
  <div style={{ padding: "16px 0" }}>
    <div style={{ marginBottom: 16 }}>
      <strong>שם החניך:</strong> {assignmentModal.member.name}
    </div>

    <div style={{ marginBottom: 24 }}>
      <div style={{ marginBottom: 8, fontWeight: 500 }}>מתי</div>
      <Space.Compact style={{ width: "100%" }}>
        <DatePicker
          style={{ flex: 1 }}
          value={assignmentModal.startDate}
          onChange={(date) => {
            setAssignmentModal((prev) => {
              const newStartDate = date;
              let newEndDate = prev.endDate;
              
              // אם אין תאריך סיום או שתאריך הסיום לפני ההתחלה החדשה
              if (!newEndDate || newEndDate.isBefore(newStartDate, 'day')) {
                newEndDate = newStartDate;
              }
              
              return {
                ...prev,
                startDate: newStartDate,
                endDate: newEndDate,
              };
            });
          }}
          disabledDate={(current) => {
            if (!assignmentModal.endDate) return false;
            return current.isAfter(assignmentModal.endDate, 'day');
          }}
          format="DD/MM/YYYY"
          dir="rtl"
        />
        <TimePicker
          style={{ flex: 1 }}
          value={assignmentModal.startTime}
          onChange={(time) => {
            setAssignmentModal((prev) => {
              const newStartTime = time;
              let newEndTime = prev.endTime;
              
              // אם אותו תאריך ושעת התחלה אחרי שעת סיום
              if (
                prev.startDate?.isSame(prev.endDate, 'day') &&
                newStartTime &&
                newEndTime &&
                newStartTime && newEndTime && (newStartTime.isSame(newEndTime) || newStartTime.isAfter(newEndTime))
              ) {
                newEndTime = newStartTime.add(30, 'minute');
              }
              
              return {
                ...prev,
                startTime: newStartTime,
                endTime: newEndTime,
              };
            });
          }}
          disabledTime={(current) => {
            if (!assignmentModal.startDate || 
                !assignmentModal.endDate || 
                !assignmentModal.startDate.isSame(assignmentModal.endDate, 'day')) {
              return {};
            }
            return {
              disabledHours: () => {
                const hours: number[] = [];
                const endHour = assignmentModal.endTime?.hour() ?? 23;
                for (let i = endHour + 1; i <= 23; i++) {
                  hours.push(i);
                }
                return hours;
              },
            };
          }}
          format="HH:mm"
          minuteStep={15}
          dir="rtl"
        />
      </Space.Compact>
    </div>

    <div style={{ marginBottom: 16 }}>
      <div style={{ marginBottom: 8, fontWeight: 500 }}>עד מתי</div>
      <Space.Compact style={{ width: "100%" }}>
        <DatePicker
          style={{ flex: 1 }}
          value={assignmentModal.endDate}
          onChange={(date) => {
            setAssignmentModal((prev) => {
              const newEndDate = date;
              let newStartDate = prev.startDate;
              
              // אם אין תאריך התחלה או שתאריך ההתחלה אחרי הסיום החדש
              if (!newStartDate || newStartDate.isAfter(newEndDate, 'day')) {
                newStartDate = newEndDate;
              }
              
              return {
                ...prev,
                startDate: newStartDate,
                endDate: newEndDate,
              };
            });
          }}
          disabledDate={(current) => {
            if (!assignmentModal.startDate) return false;
            return current.isBefore(assignmentModal.startDate, 'day');
          }}
          format="DD/MM/YYYY"
          dir="rtl"
        />
        <TimePicker
          style={{ flex: 1 }}
          value={assignmentModal.endTime}
          onChange={(time) => {
            setAssignmentModal((prev) => {
              const newEndTime = time;
              let newStartTime = prev.startTime;
              
              // אם אותו תאריך ושעת סיום לפני שעת התחלה
              if (
                prev.startDate?.isSame(prev.endDate, 'day') &&
                newStartTime &&
                newEndTime &&
                newEndTime.isSame(newStartTime) || newEndTime.isBefore(newStartTime)
              ) {
                newStartTime = newEndTime.subtract(30, 'minute');
              }
              
              return {
                ...prev,
                startTime: newStartTime,
                endTime: newEndTime,
              };
            });
          }}
          disabledTime={(current) => {
            if (!assignmentModal.startDate || 
                !assignmentModal.endDate || 
                !assignmentModal.startDate.isSame(assignmentModal.endDate, 'day')) {
              return {};
            }
            return {
              disabledHours: () => {
                const hours: number[] = [];
                const startHour = assignmentModal.startTime?.hour() ?? 0;
                for (let i = 0; i < startHour; i++) {
                  hours.push(i);
                }
                return hours;
              },
            };
          }}
          format="HH:mm"
          minuteStep={15}
          dir="rtl"
        />
      </Space.Compact>
    </div>
  </div>
)}
      </Modal>
   </>
  );
};

export default TaskMembersStatus;
