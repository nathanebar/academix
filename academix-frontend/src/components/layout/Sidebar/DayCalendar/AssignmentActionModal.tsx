// src/components/AssignmentActionModal.tsx

import { Modal } from "antd";
import {
  WarningOutlined,
  PlusCircleOutlined,
  FileAddOutlined,
  RightOutlined,
} from "@ant-design/icons";

interface AssignmentActionModalProps {
  type: "team" | "teamMember";
  onSelect: (action: "expand" | "new" | null) => void;
}

const BUTTON_STYLE = {
  width: "100%",
  padding: "16px 20px",
  border: "1px solid #e2e8f0",
  borderRadius: "12px",
  backgroundColor: "#f8fafc",
  cursor: "pointer",
  transition: "all 0.2s ease",
  textAlign: "right" as const,
  display: "flex",
  alignItems: "center",
  gap: "14px",
};

const ICON_WRAPPER = (bg: string) => ({
  width: "40px",
  height: "40px",
  borderRadius: "10px",
  backgroundColor: bg,
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
});

// 👇 קומפוננטת תוכן המודל (לא המודל עצמו!)
export const AssignmentModalContent = ({ type, onSelect }: AssignmentActionModalProps) => {
  const title =
    type === "team"
      ? "למשימה הזו כבר קיים שיבוץ"
      : "למשימה הזו כבר קיים שיבוץ לחבר הצוות";

  return (
    <div style={{ padding: "8px 0 16px" }}>
      <p style={{ marginBottom: "20px", color: "#64748b", fontSize: "14px", direction: "rtl" }}>
        מה תרצה לעשות עם השיבוץ החדש?
      </p>

      <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
        {/* הרחבה */}
        <button
          style={BUTTON_STYLE}
          onClick={() => {
            Modal.destroyAll();
            onSelect("expand");
          }}
        >
          <div style={ICON_WRAPPER("#d1fae5")}>
            <PlusCircleOutlined style={{ fontSize: "20px", color: "#059669" }} />
          </div>
          <div style={{ flex: 1, direction: "rtl" }}>
            <div style={{ fontWeight: 600, color: "#1e293b", fontSize: "14px" }}>
              הוסף מועד למשימה הנוכחית
            </div>
            <div style={{ fontSize: "12px", color: "#64748b" }}>הרחבת השיבוץ הקיים</div>
          </div>
          <RightOutlined style={{ color: "#94a3b8", fontSize: "12px" }} />
        </button>

        {/* משימה חדשה */}
        <button
          style={BUTTON_STYLE}
          onClick={() => {
            Modal.destroyAll();
            onSelect("new");
          }}
        >
          <div style={ICON_WRAPPER("#dbeafe")}>
            <FileAddOutlined style={{ fontSize: "20px", color: "#2563eb" }} />
          </div>
          <div style={{ flex: 1, direction: "rtl" }}>
            <div style={{ fontWeight: 600, color: "#1e293b", fontSize: "14px" }}>
              צור משימה חדשה
            </div>
            <div style={{ fontSize: "12px", color: "#64748b" }}>שיבוץ במשימה נפרדת</div>
          </div>
          <RightOutlined style={{ color: "#94a3b8", fontSize: "12px" }} />
        </button>

        {/* ביטול */}
        <button
          style={{
            width: "100%",
            padding: "12px",
            border: "none",
            borderRadius: "10px",
            backgroundColor: "transparent",
            cursor: "pointer",
            color: "#94a3b8",
            fontSize: "13px",
            fontWeight: 500,
            marginTop: "4px",
          }}
          onClick={() => {
            Modal.destroyAll();
            onSelect(null);
          }}
        >
          ביטול
        </button>
      </div>
    </div>
  );
};

// 👇 פונקציה שמציגה את המודל
export const showAssignmentModal = (type: "team" | "teamMember"): Promise<string | null> => {
  const title = type === "team"
    ? "למשימה הזו כבר קיים שיבוץ"
    : "למשימה הזו כבר קיים שיבוץ לחבר הצוות";

  return new Promise((resolve) => {
    Modal.confirm({
      title: (
        <div style={{ display: "flex", alignItems: "center", gap: "12px", direction: "rtl" }}>
          <WarningOutlined style={{ color: "#f59e0b", fontSize: "24px" }} />
          <span style={{ direction: "rtl" }}>{title}</span>
        </div>
      ),
      content: (
        <AssignmentModalContent
          type={type}
          onSelect={(action) => {
            Modal.destroyAll();
            resolve(action);
          }}
        />
      ),
      footer: null,
      width: 400,
      centered: true,
      icon: null,
    });
  });
};