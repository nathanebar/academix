import React, { useState, useEffect } from "react";
import {
  Modal,
  Select,
  DatePicker,
  Table,
  Button,
  Tag,
  Space,
  Typography,
  Card,
  Row,
  Col,
  Badge,
  Avatar,
  Tooltip,
  Empty,
  message,
  Popconfirm,
  Divider,
  Statistic,
} from "antd";
import {
  UserAddOutlined,
  DeleteOutlined,
  CalendarOutlined,
  ClockCircleOutlined,
  TeamOutlined,
  CheckCircleOutlined,
  ExclamationCircleOutlined,
  CrownOutlined,
  SendOutlined,
} from "@ant-design/icons";
import dayjs from "dayjs";
import type { Dayjs } from "dayjs";
import { useMutation, useQueryClient } from "@tanstack/react-query";

// ==========================================
// 🎯 Types
// ==========================================

interface TeamMember {
  id: number;
  user_id: number;
  member_role: "STUDENT" | "TEAM_COMMANDER" | "OVERLAP";
  team_id: number;
  user: {
    id: number;
    name: string;
    email: string;
    avatar?: string;
  };
}

interface HoefAssignment {
  id?: number;
  task_assignment_id: number;
  team_member_id: number;
  deadline: Dayjs | null;
  teamMember?: TeamMember;
}

interface HoefModalProps {
  open: boolean;
  onClose: () => void;
  taskAssignment: {
    id: number;
    task_id: number;
    task?: {
      name: string;
      color?: string;
      recommendedTime?: number;
    };
    team_id: number;
    start: string | Date;
    end: string | Date;
  } | null;
  availableHoefs: TeamMember[];
  existingHoefs: HoefAssignment[];
  onSave: (hoefs: HoefAssignment[]) => Promise<void>;
  courseBatchId: number;
}

// ==========================================
// 🎨 הקומפוננטה הראשית
// ==========================================

export const HoefAssignmentModal: React.FC<HoefModalProps> = ({
  open,
  onClose,
  taskAssignment,
  availableHoefs,
  existingHoefs,
  onSave,
}) => {
  const queryClient = useQueryClient();
  const [selectedHoefs, setSelectedHoefs] = useState<HoefAssignment[]>([]);
  const [selectedTeamMemberId, setSelectedTeamMemberId] = useState<number | null>(null);
  const [saving, setSaving] = useState(false);

  // אתחול החופפים הקיימים
  useEffect(() => {
    if (existingHoefs.length > 0) {
      setSelectedHoefs(existingHoefs.map(h => ({
        ...h,
        deadline: h.deadline ? dayjs(h.deadline) : null,
      })));
    } else {
      setSelectedHoefs([]);
    }
  }, [existingHoefs]);

  // ==========================================
  // 📊 סטטיסטיקות
  // ==========================================
  
  const stats = {
    total: selectedHoefs.length,
    withDeadline: selectedHoefs.filter(h => h.deadline).length,
    overdue: selectedHoefs.filter(h => h.deadline?.isBefore(dayjs(), "day")).length,
    upcoming: selectedHoefs.filter(h => {
      if (!h.deadline) return false;
      const diff = h.deadline.diff(dayjs(), "day");
      return diff >= 0 && diff <= 7;
    }).length,
  };

  // ==========================================
  // 🎯 פעולות
  // ==========================================

  const handleAddHoef = () => {
    if (!selectedTeamMemberId) {
      message.warning("בחר חופף להוספה");
      return;
    }

    // בדיקה אם כבר קיים
    if (selectedHoefs.some(h => h.team_member_id === selectedTeamMemberId)) {
      message.warning("חופף זה כבר נוסף למשימה");
      return;
    }

    const teamMember = availableHoefs.find(h => h.id === selectedTeamMemberId);
    if (!teamMember) return;

    const newHoef: HoefAssignment = {
      task_assignment_id: taskAssignment?.id || 0,
      team_member_id: selectedTeamMemberId,
      deadline: null,
      teamMember,
    };

    setSelectedHoefs(prev => [...prev, newHoef]);
    setSelectedTeamMemberId(null);
    message.success(`החופף ${teamMember.user.name} נוסף בהצלחה`);
  };

  const handleRemoveHoef = (teamMemberId: number) => {
    setSelectedHoefs(prev => prev.filter(h => h.team_member_id !== teamMemberId));
    message.info("החופף הוסר מהמשימה");
  };

  const handleUpdateDeadline = (teamMemberId: number, deadline: Dayjs | null) => {
    setSelectedHoefs(prev =>
      prev.map(h =>
        h.team_member_id === teamMemberId ? { ...h, deadline } : h
      )
    );
  };

  const handleSave = async () => {
    if (selectedHoefs.length === 0) {
      message.warning("הוסף לפחות חופף אחד למשימה");
      return;
    }

    setSaving(true);
    try {
      await onSave(selectedHoefs);
      message.success("החופפים נשמרו בהצלחה!");
      queryClient.invalidateQueries({ queryKey: ["hoefs"] });
      onClose();
    } catch (error) {
      message.error("שגיאה בשמירת החופפים");
    } finally {
      setSaving(false);
    }
  };

  const handleCopyToAll = () => {
    if (!taskAssignment?.end) return;
    const taskEndDate = dayjs(taskAssignment.end);
    
    setSelectedHoefs(prev =>
      prev.map(h => ({
        ...h,
        deadline: h.deadline || taskEndDate,
      }))
    );
    message.success("הדדליין הועתק לכל החופפים ללא דדליין");
  };

  // ==========================================
  // 📋 טבלת החופפים
  // ==========================================

  const columns = [
    {
      title: "חופף",
      dataIndex: "team_member_id",
      key: "hoef",
      render: (_: any, record: HoefAssignment) => (
        <Space>
          <Avatar
            style={{ 
              backgroundColor: record.teamMember?.member_role === "OVERLAP" 
                ? "#722ed1" 
                : "#1890ff",
            }}
            icon={<CrownOutlined />}
          />
          <div>
            <Typography.Text strong>
              {record.teamMember?.user?.name || "לא ידוע"}
            </Typography.Text>
            <br />
            <Typography.Text type="secondary" style={{ fontSize: 12 }}>
              {record.teamMember?.user?.email}
            </Typography.Text>
          </div>
        </Space>
      ),
    },
    {
      title: "סטטוס",
      dataIndex: "deadline",
      key: "status",
      width: 120,
      render: (_: any, record: HoefAssignment) => {
        if (!record.deadline) {
          return <Tag color="default">ללא דדליין</Tag>;
        }
        
        const isOverdue = record.deadline.isBefore(dayjs(), "day");
        const isToday = record.deadline.isSame(dayjs(), "day");
        const isSoon = record.deadline.diff(dayjs(), "day") <= 3 && !isToday;
        
        if (isOverdue) {
          return <Tag color="error" icon={<ExclamationCircleOutlined />}>פג תוקף</Tag>;
        }
        if (isToday) {
          return <Tag color="warning" icon={<ClockCircleOutlined />}>היום</Tag>;
        }
        if (isSoon) {
          return <Tag color="processing" icon={<ClockCircleOutlined />}>קרוב</Tag>;
        }
        return <Tag color="success" icon={<CheckCircleOutlined />}>בזמן</Tag>;
      },
    },
    {
      title: (
        <Space>
          <CalendarOutlined />
          דדליין
        </Space>
      ),
      dataIndex: "deadline",
      key: "deadline",
      width: 180,
      render: (_: any, record: HoefAssignment) => (
        <DatePicker
          showTime
          format="DD/MM/YYYY HH:mm"
          placeholder="בחר דדליין"
          value={record.deadline}
          onChange={(date) => handleUpdateDeadline(record.team_member_id, date)}
          size="middle"
          style={{ width: "100%" }}
          disabledDate={(current) => current && current < dayjs().startOf("day")}
        />
      ),
    },
    {
      title: "פעולות",
      key: "actions",
      width: 100,
      render: (_: any, record: HoefAssignment) => (
        <Popconfirm
          title="האם להסיר את החופף?"
          description="החופף יוסר מהמשימה"
          onConfirm={() => handleRemoveHoef(record.team_member_id)}
          okText="כן"
          cancelText="לא"
          okButtonProps={{ danger: true }}
        >
          <Button
            type="text"
            danger
            icon={<DeleteOutlined />}
            size="small"
          />
        </Popconfirm>
      ),
    },
  ];

  // ==========================================
  // 🎨 רינדור
  // ==========================================

  return (
    <Modal
      open={open}
      onCancel={onClose}
      width={900}
      footer={null}
      title={null}
      centered
      className="hoef-modal"
      styles={{
        body: { padding: 0 },
        mask: { backdropFilter: "blur(4px)" },
      }}
    >
      {/* 🎯 Header */}
      <div
        style={{
          background: `linear-gradient(135deg, ${taskAssignment?.task?.color || "#722ed1"} 0%, ${
            taskAssignment?.task?.color ? `${taskAssignment.task.color}dd` : "#8b5cf6"
          } 100%)`,
          padding: "24px 24px 60px 24px",
          color: "#fff",
        }}
      >
        <Row gutter={24} align="middle">
          <Col flex="none">
            <div
              style={{
                width: 64,
                height: 64,
                borderRadius: 16,
                background: "rgba(255,255,255,0.2)",
                backdropFilter: "blur(10px)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: 28,
              }}
            >
              📋
            </div>
          </Col>
          <Col flex="auto">
            <Typography.Title level={3} style={{ color: "#fff", margin: 0 }}>
              {taskAssignment?.task?.name || "משימה"}
            </Typography.Title>
            <Typography.Text style={{ color: "rgba(255,255,255,0.85)" }}>
              ניהול חופפים למשימה
            </Typography.Text>
            <div style={{ marginTop: 8 }}>
              <Space split={<Divider type="vertical" style={{ borderColor: "rgba(255,255,255,0.4)" }} />}>
                <span>
                  <TeamOutlined /> #{taskAssignment?.id}
                </span>
                {taskAssignment?.start && (
                  <span>
                    <CalendarOutlined /> {dayjs(taskAssignment.start).format("DD/MM/YYYY HH:mm")}
                  </span>
                )}
                {taskAssignment?.task?.recommendedTime && (
                  <span>
                    <ClockCircleOutlined /> {taskAssignment.task.recommendedTime} דקות
                  </span>
                )}
              </Space>
            </div>
          </Col>
          <Col flex="none">
            <Badge
              count={selectedHoefs.length}
              showZero
              style={{
                backgroundColor: "rgba(255,255,255,0.3)",
                fontSize: 14,
              }}
            >
              <Avatar
                size={48}
                style={{ 
                  backgroundColor: "rgba(255,255,255,0.2)",
                  border: "2px solid rgba(255,255,255,0.5)"
                }}
                icon={<CrownOutlined style={{ color: "#fff" }} />}
              />
            </Badge>
          </Col>
        </Row>
      </div>

      {/* 📊 סטטיסטיקות */}
      <div
        style={{
          marginTop: -40,
          marginLeft: 24,
          marginRight: 24,
          background: "#fff",
          borderRadius: 12,
          padding: "16px 20px",
          boxShadow: "0 4px 12px rgba(0,0,0,0.08)",
        }}
      >
        <Row gutter={16}>
          <Col span={6}>
            <Statistic
              title={<span style={{ fontSize: 12 }}>סה"כ חופפים</span>}
              value={stats.total}
              prefix={<TeamOutlined style={{ color: "#722ed1" }} />}
              valueStyle={{ color: "#722ed1", fontSize: 28 }}
            />
          </Col>
          <Col span={6}>
            <Statistic
              title={<span style={{ fontSize: 12 }}>עם דדליין</span>}
              value={stats.withDeadline}
              prefix={<CalendarOutlined style={{ color: "#52c41a" }} />}
              valueStyle={{ color: "#52c41a", fontSize: 28 }}
            />
          </Col>
          <Col span={6}>
            <Statistic
              title={<span style={{ fontSize: 12 }}>קרוב (עד 3 ימים)</span>}
              value={stats.upcoming}
              prefix={<ClockCircleOutlined style={{ color: "#faad14" }} />}
              valueStyle={{ color: "#faad14", fontSize: 28 }}
            />
          </Col>
          <Col span={6}>
            <Statistic
              title={<span style={{ fontSize: 12 }}>פגי תוקף</span>}
              value={stats.overdue}
              prefix={<ExclamationCircleOutlined style={{ color: "#ff4d4f" }} />}
              valueStyle={{ color: "#ff4d4f", fontSize: 28 }}
            />
          </Col>
        </Row>
      </div>

      {/* ➕ הוספת חופף חדש */}
      <Card
        size="small"
        style={{
          margin: "20px 24px 0 24px",
          borderRadius: 12,
          border: "1px dashed #d9d9d9",
        }}
      >
        <Row gutter={16} align="middle">
          <Col flex="auto">
            <Select
              placeholder="בחר חופף להוספה..."
              value={selectedTeamMemberId}
              onChange={setSelectedTeamMemberId}
              style={{ width: "100%" }}
              size="large"
              showSearch
              optionFilterProp="children"
             /*  filterOption={(input, option) =>
                (option?.label ?? "")?.toLowerCase().includes(input.toLowerCase())
              } */
              options={availableHoefs
                .filter(hoef => !selectedHoefs.some(h => h.team_member_id === hoef.id))
                .map(hoef => ({
                  value: hoef.id,
                  label: (
                    <Space>
                      <Avatar size="small" style={{ backgroundColor: "#722ed1" }}>
                        {hoef.user?.name?.charAt(0) || "?"}
                      </Avatar>
                      <span>{hoef.user?.name || "לא ידוע"}</span>
                      <Tag color="purple" style={{ marginLeft: 8 }}>חופף</Tag>
                      <Typography.Text type="secondary" style={{ fontSize: 12 }}>
                        {hoef.user?.email}
                      </Typography.Text>
                    </Space>
                  ),
                }))}
            />
          </Col>
          <Col flex="none">
            <Button
              type="primary"
              icon={<UserAddOutlined />}
              onClick={handleAddHoef}
              size="large"
              style={{
                borderRadius: 8,
                background: "linear-gradient(135deg, #722ed1 0%, #8b5cf6 100%)",
                border: "none",
                boxShadow: "0 4px 12px rgba(114, 46, 209, 0.3)",
              }}
            >
              הוסף חופף
            </Button>
          </Col>
        </Row>
      </Card>

      {/* 📋 טבלת החופפים */}
      <div style={{ padding: "20px 24px 24px 24px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
          <Typography.Title level={5} style={{ margin: 0 }}>
            רשימת החופפים ({selectedHoefs.length})
          </Typography.Title>
          {selectedHoefs.length > 0 && (
            <Button
              type="link"
              icon={<CalendarOutlined />}
              onClick={handleCopyToAll}
              disabled={!taskAssignment?.end}
            >
              העתק דדליין מהמשימה לכולם
            </Button>
          )}
        </div>

        <Table
          dataSource={selectedHoefs}
          columns={columns}
          rowKey="team_member_id"
          pagination={false}
          locale={{
            emptyText: (
              <Empty
                image={Empty.PRESENTED_IMAGE_SIMPLE}
                description={
                  <span>
                    לא נוספו חופפים עדיין
                    <br />
                    <Typography.Text type="secondary">
                      בחר חופף מהרשימה ולחץ על "הוסף חופף"
                    </Typography.Text>
                  </span>
                }
              />
            ),
          }}
          style={{
            borderRadius: 12,
            overflow: "hidden",
            border: "1px solid #f0f0f0",
          }}
          rowClassName={(record, index) => 
            record.deadline?.isBefore(dayjs(), "day") 
              ? "overdue-row" 
              : record.deadline?.isSame(dayjs(), "day")
              ? "today-row"
              : ""
          }
        />
      </div>

      {/* 🎯 Footer */}
      <div
        style={{
          padding: "16px 24px",
          borderTop: "1px solid #f0f0f0",
          background: "#fafafa",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          borderRadius: "0 0 12px 12px",
        }}
      >
        <Space>
          <Button onClick={onClose} size="large">
            ביטול
          </Button>
        </Space>
        <Space>
          <Typography.Text type="secondary">
            {selectedHoefs.length} חופפים נבחרו
          </Typography.Text>
          <Button
            type="primary"
            icon={<SendOutlined />}
            onClick={handleSave}
            loading={saving}
            size="large"
            disabled={selectedHoefs.length === 0}
            style={{
              borderRadius: 8,
              background: selectedHoefs.length > 0 
                ? "linear-gradient(135deg, #722ed1 0%, #8b5cf6 100%)"
                : "#d9d9d9",
              border: "none",
              boxShadow: selectedHoefs.length > 0 
                ? "0 4px 12px rgba(114, 46, 209, 0.3)"
                : "none",
            }}
          >
            שמור חופפים
          </Button>
        </Space>
      </div>
    </Modal>
  );
};