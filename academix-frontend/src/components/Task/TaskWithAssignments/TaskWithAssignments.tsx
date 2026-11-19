// components/Task/TaskWithAssignments/TaskWithAssignments.tsx
import { useState } from "react";
import { Modal, Button, Space, Typography } from "antd";
import { TeamOutlined } from "@ant-design/icons";
import dayjs from "dayjs";
import TaskUserTag from "../TaskTag/TaskUserTag";
import TaskTeamTag from "../TaskTag/TaskTeamTag";

const { Text } = Typography;

interface TaskWithAssignmentsProps {
  task: any;
  activeHeaderType: any;
  fromGradeStage?: boolean;
}

export const TaskWithAssignments: React.FC<TaskWithAssignmentsProps> = ({
  task,
  activeHeaderType,
  fromGradeStage,
}) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const hasMultipleAssignments = task.allAssignments?.length > 1;

  // =============================================
  // רנדור הטאג הרגיל
  // =============================================
  const renderTag = () => {
    if (activeHeaderType === "teamMember" && !fromGradeStage) {
      return <TaskUserTag task={task} />;
    }
    if (!fromGradeStage) {
      return <TaskTeamTag task={task} fromCourseContent={true} />;
    }
    return null;
  };

  // =============================================
  // רנדור טאג לשיבוץ ספציפי
  // =============================================
  const renderAssignmentTag = (assignment: any) => {
    // יצירת אובייקט משימה זמני מהשיבוץ
    const assignmentTask = {
      ...task,
      ...assignment,
      id: task.id,
      task_assignment_id: assignment.task_assignment_id,
    };

    if (activeHeaderType === "teamMember" && !fromGradeStage) {
      return <TaskUserTag task={assignmentTask} />;
    }
    if (!fromGradeStage) {
      return <TaskTeamTag task={assignmentTask} fromCourseContent={true} />;
    }
    return null;
  };

  // =============================================
  // משימה עם שיבוץ אחד - הצג כרגיל
  // =============================================
  if (!hasMultipleAssignments) {
    return <>{renderTag()}</>;
  }

  // =============================================
  // משימה עם מספר שיבוצים
  // =============================================
  return (
    <>
      {/* כפתור לפתיחת המודל */}
     <div style={{ width: "130px",alignItems:'center' }}>
  <Button
    type="text"
    size="small"
    onClick={() => setIsModalOpen(true)}
    style={{
      padding: "0 8px",
      height: "auto",
      display: "flex",
      alignItems: "center",
      gap: "4px",
      width: "100%", // תופס את כל הרוחב של ה-div
    }}
  >
        <TeamOutlined style={{ color: task.color || "blue" }} />
        <Text
          style={{
            fontSize: "12px",
            color: task.completed ? "#52c41a" : "#1890ff",
          }}
        >
          {task.allAssignments.length} שיבוצים
        </Text>
      </Button>
      </div>

      {/* מודל עם כל השיבוצים */}
      <Modal
        title={
          <Space>
            <TeamOutlined style={{ color: task.color }} />
            <span>{task.name}</span>
          </Space>
        }
        open={isModalOpen}
        onCancel={() => setIsModalOpen(false)}
        footer={null}
        width={700}
      >
        <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
          {task.allAssignments.map((assignment: any, index: number) => (
            <div
              key={assignment.task_assignment_id}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "12px",
                padding: "8px",
                background: assignment.completed ? "#f6ffed" : "#fafafa",
                borderRadius: "8px",
                border: assignment.completed
                  ? "1px solid #b7eb8f"
                  : "1px solid #d9d9d9",
              }}
            >
              {/* מספר סידורי */}
              <Text type="secondary" style={{ minWidth: "24px" }}>
                {index + 1}.
              </Text>

              {/* הטאג של השיבוץ */}
              <div style={{ flex: 1 }}>
                {renderAssignmentTag(assignment)}
              </div>

              {/* תאריכים */}
              <Space size={4}>
                <Text type="secondary" style={{ fontSize: "12px" }}>
                  {assignment.assigned
                    ? dayjs(assignment.assigned).format("DD/MM HH:mm")
                    : "ללא התחלה"}
                </Text>
                <Text type="secondary">-</Text>
                <Text
                  type="secondary"
                  style={{ fontSize: "12px", color: "#ff4d4f" }}
                >
                  {assignment.end_date
                    ? dayjs(assignment.end_date).format("DD/MM HH:mm")
                    : "ללא סיום"}
                </Text>
              </Space>

              {/* ציון */}
              {assignment.form_score !== null &&
                assignment.form_score !== undefined && (
                  <Text strong style={{ color: "#1890ff", minWidth: "80px" }}>
                    {assignment.form_score}
                    {assignment.max_score > 0 &&
                      `/${assignment.max_score}`}
                  </Text>
                )}


            </div>
          ))}
        </div>
      </Modal>
    </>
  );
};

export default TaskWithAssignments;