// src/components/AssignmentActionModal.tsx

import { Modal } from "antd";
import {
  WarningOutlined,
  PlusCircleOutlined,
  FileAddOutlined,
  RightOutlined,
} from "@ant-design/icons";
import { cssVar, radius } from "../../../../theme/tokens";

interface AssignmentActionModalProps {
  type: "team" | "teamMember";
  onSelect: (action: "expand" | "new" | null) => void;
}

const BUTTON_STYLE = {
  width: "100%",
  padding: "16px 20px",
  border: `1px solid ${cssVar("slate200")}`,
  borderRadius: radius.xl,
  backgroundColor: cssVar("slate50"),
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
  borderRadius: radius.lg,
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
      <p style={{ marginBottom: "20px", color: cssVar("slate500"), fontSize: "14px", direction: "rtl" }}>
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
          <div style={ICON_WRAPPER("#d1fae5") /* TODO(tokens) */}>
            <PlusCircleOutlined style={{ fontSize: "20px", color: cssVar("emerald600") }} />
          </div>
          <div style={{ flex: 1, direction: "rtl" }}>
            <div style={{ fontWeight: 600, color: cssVar("slate800"), fontSize: "14px" }}>
              הוסף מועד למשימה הנוכחית
            </div>
            <div style={{ fontSize: "12px", color: cssVar("slate500") }}>הרחבת השיבוץ הקיים</div>
          </div>
          <RightOutlined style={{ color: cssVar("slate400"), fontSize: "12px" }} />
        </button>

        {/* משימה חדשה */}
        <button
          style={BUTTON_STYLE}
          onClick={() => {
            Modal.destroyAll();
            onSelect("new");
          }}
        >
          <div style={ICON_WRAPPER("#dbeafe") /* TODO(tokens) */}>
            <FileAddOutlined style={{ fontSize: "20px", color: "#2563eb" /* TODO(tokens) */ }} />
          </div>
          <div style={{ flex: 1, direction: "rtl" }}>
            <div style={{ fontWeight: 600, color: cssVar("slate800"), fontSize: "14px" }}>
              צור משימה חדשה
            </div>
            <div style={{ fontSize: "12px", color: cssVar("slate500") }}>שיבוץ במשימה נפרדת</div>
          </div>
          <RightOutlined style={{ color: cssVar("slate400"), fontSize: "12px" }} />
        </button>

        {/* ביטול */}
        <button
          style={{
            width: "100%",
            padding: "12px",
            border: "none",
            borderRadius: radius.lg,
            backgroundColor: "transparent",
            cursor: "pointer",
            color: cssVar("slate400"),
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
          <WarningOutlined style={{ color: cssVar("amber500"), fontSize: "24px" }} />
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