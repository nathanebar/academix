import React, { useEffect, useMemo, useState } from "react";
import {
  Modal,
  Select,
  Steps,
  Button,
  Divider,
  Alert,
  Space,
  Typography,
} from "antd";
import type { StepsProps } from "antd";
import {
  CheckOutlined,
  AuditOutlined,
  FileTextOutlined,
  CalendarOutlined,
  ClockCircleOutlined,
  AppstoreAddOutlined,
  RightOutlined,
} from "@ant-design/icons";
import EventCreationStep from "./EventCreationStep";
import type { EventCreationData } from "./EventCreationStep";
import { useAddTeamEvent } from "../../../hooks/useTeamEvent";
import { useSelectionsStore } from "../../../store/selectionStore";
import { useQueryClient } from "@tanstack/react-query";
import { TeamEventAssignment } from "../../../types/types";
import { useAddTeamEventAssignments } from "../../../hooks/useFetchTeamEventAssignments";
import dayjs from "dayjs";
const { Text } = Typography;

interface Axis {
  id: number;
  name: string;
  color?: string;
}

interface TaskGroup {
  id: number;
  name: string;
  axisId?: number;
  axisName?: string;
  color?: string;
}

interface CreateTaskWizardProps {
  open: boolean;
  onClose: () => void;
  onCancel: () => void;
  axes: Axis[];
  taskGroups: TaskGroup[];
  generateConstantTeamEvent: (
    start: Date,
    end: Date,
    startHour: number,
    endHour: number,
    teamEventAssignment: Omit<TeamEventAssignment, "id">,
    days: number[]
  ) => void;
  selectedDate?: Date;
  selectedStartTime?: string;
  selectedEndTime?: string;
  onStep1Complete?: (
    taskGroupId: number,
    axisId: number,
    axisColor: string,
    selectedDate?: Date,
    selectedStartTime?: string,
    selectedEndTime?: string
  ) => void;
}

type StepStatus = "process" | "finish" | "wait";

function getStepStatus(
  condition: boolean,
  whenTrue: StepStatus,
  whenFalse: StepStatus
): StepStatus {
  return condition ? whenTrue : whenFalse;
}

export const CreateTaskFromCalendar: React.FC<CreateTaskWizardProps> = ({
  open,
  onClose,
  onCancel,
  axes,
  taskGroups,
  generateConstantTeamEvent,
  selectedDate,
  selectedStartTime,
  selectedEndTime,
  onStep1Complete,
}) => {
  const [currentStep, setCurrentStep] = useState(0);
  const [creationType, setCreationType] = useState<"event" | "task" | null>(
    null
  );
  const [selectedAxisId, setSelectedAxisId] = useState<number | null>(null);
  const [selectedTaskGroupId, setSelectedTaskGroupId] = useState<number | null>(
    null
  );
  const queryClient = useQueryClient();
  const addTeamEventMutation = useAddTeamEvent();
  const addTeamEventAssignmentMutation = useAddTeamEventAssignments();
  const { selectedTeam, selectedCourseBatch, selectedTeamMember } =
    useSelectionsStore();
  const resetState = () => {
    setCurrentStep(0);
    setCreationType(null);
    setSelectedAxisId(null);
    setSelectedTaskGroupId(null);
  };
  const memberId = selectedTeamMember?.id ?? -1;

  useEffect(() => {
    if (open) resetState();
  }, [open]);

  const formattedDate = useMemo(() => {
    if (!selectedDate) return null;
    return selectedDate.toLocaleDateString("he-IL", {
      day: "numeric",
      month: "long",
      year: "numeric",
    });
  }, [selectedDate]);

  const filteredTaskGroups = useMemo(() => {
    return selectedAxisId
      ? taskGroups?.filter((tg) => tg?.axisId === selectedAxisId)
      : taskGroups;
  }, [selectedAxisId, taskGroups]);

  const selectedAxis = axes?.find((a) => a.id === selectedAxisId);
  const selectedGroup = taskGroups?.find((tg) => tg.id === selectedTaskGroupId);
  const resolvedAxisId = selectedAxisId || selectedGroup?.axisId || undefined;

  const canProceed = selectedAxisId && selectedTaskGroupId;

  const handleCancel = () => {
    resetState();
    onCancel();
    onClose();
  };

  const handleTypeSelect = (type: "event" | "task") => {
    setCreationType(type);
    setCurrentStep(1);
  };

  const handleBackToType = () => {
    setSelectedAxisId(null);
    setSelectedTaskGroupId(null);
    setCreationType(null);
    setCurrentStep(0);
  };

  const handleNext = () => {
    if (creationType !== "task") return;

    if (canProceed && onStep1Complete) {
      onStep1Complete?.(
        selectedTaskGroupId!,
        resolvedAxisId!,
        selectedAxis?.color || selectedGroup?.color || "#1890ff",
        selectedDate,
        selectedStartTime,
        selectedEndTime
      );
      setCurrentStep(2);
    }

    handleCancel();
  };

  const handleEventSave = async (data: EventCreationData) => {
    const {
      startDate,
      endDate,
      startHour,
      endHour,
      recommendedTime,
      days,
      constant,
      title,
      color,
    } = data;

    try {
      const savedEvent = await addTeamEventMutation.mutateAsync({
        courseBatchId: selectedCourseBatch.id,
        teamId: selectedTeam.id,
        color,
        days,
        startDate: constant ? startDate : null,
        endDate: constant ? endDate : null,
        endHour,
        startHour,
        recommendedTime,
        title,
        constant,
      });
      queryClient.invalidateQueries({ queryKey: ["teamEvents"] });

      if (constant) {
        generateConstantTeamEvent(
          startDate,
          endDate,
          startHour,
          endHour,
          {
            start: startDate,
            end: dayjs(startDate).add(recommendedTime, "minutes").toDate(),
            TeamEventId: savedEvent.id,
            teamMemberId: selectedTeamMember ? selectedTeamMember.id : null,
          },
          days.map((day) => day % 7)
        );
      } else {
        await addTeamEventAssignmentMutation.mutateAsync({
          start: startDate,
          end: dayjs(startDate).add(recommendedTime, "minutes").toDate(),
          TeamEventId: savedEvent.id,
          teamMemberId: selectedTeamMember ? selectedTeamMember.id : null,
        });
      }

      resetState();
      onClose();
    } catch (error) {
      console.error("Erreur lors de la création de l'événement", error);
    }
  };
  const handleBack = () => {
    setCurrentStep(1);
  };
  const stepItems: StepsProps["items"] = [
    {
      title: "בחירת סוג",
      icon: <AppstoreAddOutlined />,
      status: getStepStatus(currentStep === 0, "process", "finish"),
    },
    ...(creationType
      ? [
          {
            title:
              creationType === "event" ? "פרטי האירוע" : "בחירת ציר וקבוצה",
            icon:
              creationType === "event" ? (
                <CalendarOutlined />
              ) : (
                <AuditOutlined />
              ),
            status: getStepStatus(
              currentStep === 1,
              "process",
              creationType === "task" && currentStep > 1 ? "finish" : "wait"
            ),
          },
        ]
      : []),
    ...(creationType === "task"
      ? [
          {
            title: "פרטי המשימה",
            icon: <FileTextOutlined />,
            status: getStepStatus(currentStep === 2, "process", "wait"),
          },
        ]
      : []),
  ];

  return (
    <Modal
      open={open}
      onCancel={handleCancel}
      footer={null}
      width={680}
      destroyOnClose
      centered
      className="create-task-wizard-modal"
      styles={{
        body: { padding: "24px" },
        header: {
          borderBottom: "1px solid #f0f0f0",
          marginBottom: 0,
          paddingBottom: 16,
        },
      }}
      title={
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <div>
            <Text
              strong
              style={{ fontSize: 18, display: "block", lineHeight: 1.3 }}
            >
              יצירת אירוע או משימה חדשה
            </Text>
            <Text type="secondary" style={{ fontSize: 12 }}>
              בחר סוג, ואז מלא את הפרטים
            </Text>
          </div>
        </div>
      }
    >
      {selectedDate && (
        <div
          style={{
            background: "linear-gradient(135deg, #f0f5ff 0%, #e6f4ff 100%)",
            borderRadius: 10,
            padding: "14px 16px",
            marginBottom: 20,
            border: "1px solid #adc6ff",
            display: "flex",
            alignItems: "center",
            gap: 12,
          }}
        >
          <CalendarOutlined style={{ fontSize: 22, color: "#1890ff" }} />
          <div>
            <Text
              strong
              style={{ display: "block", fontSize: 15, color: "#333" }}
            >
              {formattedDate}
            </Text>
            {(selectedStartTime || selectedEndTime) && (
              <Space size={6}>
                <ClockCircleOutlined
                  style={{ fontSize: 12, color: "#8c8c8c" }}
                />
                <Text type="secondary" style={{ fontSize: 13 }}>
                  {selectedStartTime && `משעה ${selectedStartTime}`}
                  {selectedStartTime && selectedEndTime && " עד "}
                  {selectedEndTime && `עד שעה ${selectedEndTime}`}
                </Text>
              </Space>
            )}
          </div>
        </div>
      )}

      <div
        style={{
          background: "#fafafa",
          borderRadius: 12,
          padding: "16px 24px",
          marginBottom: 24,
          border: "1px solid #f0f0f0",
        }}
      >
        <Steps size="small" items={stepItems} />
      </div>

      {currentStep === 0 && (
        <div>
          <Text
            strong
            style={{ fontSize: 15, display: "block", marginBottom: 16 }}
          >
            מה תרצה ליצור?
          </Text>

          <div style={{ display: "flex", gap: 16 }}>
            <div
              onClick={() => handleTypeSelect("event")}
              style={{
                flex: 1,
                padding: "24px 16px",
                border: "2px solid #d9d9d9",
                borderRadius: 16,
                cursor: "pointer",
                textAlign: "center",
                background: "white",
                transition: "all 0.2s",
                boxShadow: "0 2px 8px rgba(0,0,0,0.04)",
              }}
            >
              <CalendarOutlined style={{ fontSize: 40, color: "#FF7F50" }} />
              <div style={{ marginTop: 12, fontWeight: 700, fontSize: 18 }}>
                אירוע
              </div>
              <div style={{ color: "#888", marginTop: 4, fontSize: 13 }}>
                אירוע זמני או חזרתי
              </div>
            </div>

            <div
              onClick={() => handleTypeSelect("task")}
              style={{
                flex: 1,
                padding: "24px 16px",
                border: "2px solid #d9d9d9",
                borderRadius: 16,
                cursor: "pointer",
                textAlign: "center",
                background: "white",
                transition: "all 0.2s",
                boxShadow: "0 2px 8px rgba(0,0,0,0.04)",
              }}
            >
              <AuditOutlined style={{ fontSize: 40, color: "#1890ff" }} />
              <div style={{ marginTop: 12, fontWeight: 700, fontSize: 18 }}>
                משימה
              </div>
              <div style={{ color: "#888", marginTop: 4, fontSize: 13 }}>
                משימה עם ציר וקבוצת משימות
              </div>
            </div>
          </div>
        </div>
      )}

      {currentStep === 1 && creationType === "event" && (
        <EventCreationStep
          courseBatchId={selectedCourseBatch.id}
          teamId={selectedTeam.id}
          initialDate={selectedDate}
          initialStartTime={selectedStartTime}
          initialEndTime={selectedEndTime}
          onBack={handleBackToType}
          onSave={handleEventSave}
        />
      )}

      {currentStep === 1 && creationType === "task" && (
        <div>
          <div style={{ marginBottom: 20 }}>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 8,
                marginBottom: 10,
              }}
            >
              <div
                style={{
                  width: 28,
                  height: 28,
                  borderRadius: 6,
                  background: selectedAxis?.color || "#d9d9d9",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <span style={{ color: "white", fontSize: 12 }}>1</span>
              </div>
              <Text strong style={{ fontSize: 15 }}>
                בחר ציר
              </Text>
            </div>

            <Select
              placeholder="לחץ לבחירת ציר..."
              style={{ width: "100%" }}
              value={selectedAxisId}
              onChange={(value) => {
                setSelectedAxisId(value);
                setSelectedTaskGroupId(null);
              }}
              allowClear
              showSearch
              optionFilterProp="label"
              size="large"
              options={axes.map((axis) => ({
                value: axis.id,
                label: (
                  <div
                    style={{ display: "flex", alignItems: "center", gap: 10 }}
                  >
                    <span
                      style={{
                        width: 12,
                        height: 12,
                        borderRadius: 3,
                        backgroundColor: axis.color || "#ccc",
                        flexShrink: 0,
                      }}
                    />
                    <span>{axis.name}</span>
                  </div>
                ),
              }))}
            />
          </div>

          <div style={{ marginBottom: 24 }}>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 8,
                marginBottom: 10,
              }}
            >
              <div
                style={{
                  width: 28,
                  height: 28,
                  borderRadius: 6,
                  background:
                    selectedGroup?.color || selectedAxis?.color || "#d9d9d9",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <span style={{ color: "white", fontSize: 12 }}>2</span>
              </div>
              <Text strong style={{ fontSize: 15 }}>
                בחר קבוצת משימות
              </Text>
            </div>

            <Select
              placeholder={
                selectedAxisId ? "לחץ לבחירת קבוצה..." : "בחר ציר קודם"
              }
              style={{ width: "100%" }}
              value={selectedTaskGroupId}
              onChange={setSelectedTaskGroupId}
              disabled={!selectedAxisId}
              allowClear
              showSearch
              optionFilterProp="label"
              size="large"
              options={filteredTaskGroups?.map((tg) => ({
                value: tg?.id,
                label: <span>{tg?.name}</span>,
              }))}
              notFoundContent={
                !selectedAxisId ? (
                  <Text type="secondary">בחר ציר תחילה</Text>
                ) : (
                  <Text type="secondary">אין קבוצות משימות לציר זה</Text>
                )
              }
            />
          </div>

          {canProceed && (
            <Alert
              message={
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <CheckOutlined style={{ color: "#52c41a" }} />
                  <span>
                    נבחר: <strong>{selectedAxis?.name}</strong>
                    {" › "}
                    <strong>{selectedGroup?.name}</strong>
                  </span>
                </div>
              }
              type="success"
              showIcon={false}
              style={{
                marginBottom: 24,
                background: "#f6ffed",
                border: "1px solid #b7eb8f",
                borderRadius: 8,
              }}
            />
          )}

          <Divider style={{ margin: "0 0 20px" }} />

          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
            }}
          >
            <Button size="large" onClick={handleBackToType}>
              חוזר
            </Button>

            <Button
              type="primary"
              size="large"
              iconPosition="end"
              onClick={handleNext}
              disabled={!canProceed}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 8,
                height: 44,
                paddingLeft: 24,
                paddingRight: 24,
              }}
            >
              המשך ליצירת משימה
            </Button>
          </div>
        </div>
      )}

      {currentStep === 2 && (
        <div>
          <Alert
            message="המשימה תיפתח בחלון חדש"
            description={
              <div>
                <p>
                  נבחר: <strong>{selectedAxis?.name}</strong> ›{" "}
                  <strong>{selectedGroup?.name}</strong>
                </p>
                <p style={{ color: "#999", marginTop: 8 }}>
                  הוויזרד יסגר וייפתח חלון יצירת המשימה
                </p>
              </div>
            }
            type="info"
            showIcon
          />

          <div style={{ display: "flex", gap: 12, marginTop: 24 }}>
            <Button size="large" onClick={handleBack} icon={<RightOutlined />}>
              חזרה
            </Button>
          </div>
        </div>
      )}
    </Modal>
  );
};

export default CreateTaskFromCalendar;
