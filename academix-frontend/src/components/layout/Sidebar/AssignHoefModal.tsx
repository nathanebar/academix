// components/AssignHoefModal/AssignHoefModal.tsx
import React, { useState } from "react";
import { Modal, Button, Tag } from "antd";
import { TeamOutlined } from "@ant-design/icons";
import { getHoefTeamSummary } from "../../../services/ApiServices";

interface AssignHoefModalContentProps {
  taskName: string;
  hoefs: any[];
  onSelect: (value: { hoefId: number } | null) => void;
}

const AssignHoefModalContent: React.FC<AssignHoefModalContentProps> = ({
  taskName,
  hoefs,
  onSelect
}) => {
  const [selectedHoef, setSelectedHoef] = useState<number | null>(null);
  const [hoveredId, setHoveredId] = useState<number | null>(null);

  const handleConfirm = () => {
    Modal.destroyAll();
    onSelect(selectedHoef ? { hoefId: selectedHoef } : null);
  };

  return (
    <div style={{ padding: "8px 0" }}>
      <p style={{ marginBottom: 16, color: "#666", direction: "rtl" }}>
        האם תרצה לשבץ את המשימה <strong>{taskName}</strong> לחופף?
      </p>
    

      {hoefs.length === 0 ? (
        <div style={{ 
          textAlign: "center", 
          padding: 20, 
          color: "#999",
          direction: "rtl" 
        }}>
          אין חופפים זמינים בצוות זה
        </div>
      ) : (
        <div style={{ 
          maxHeight: 300, 
          overflowY: "auto",
          border: "1px solid #e8e8e8",
          borderRadius: 8,
          marginBottom: 16
        }}>
          {hoefs.map((hoef: any) => (
            <div
              key={hoef.hoef_member_id}
              onClick={() => setSelectedHoef(hoef.hoef_member_id)}
              onMouseEnter={() => setHoveredId(hoef.hoef_member_id)}
              onMouseLeave={() => setHoveredId(null)}
              style={{
                padding: "12px 16px",
                borderBottom: "1px solid #f0f0f0",
                cursor: "pointer",
                backgroundColor: 
                  selectedHoef === hoef.hoef_member_id ? "#e6f7ff" :
                  hoveredId === hoef.hoef_member_id ? "#fafafa" : "#fff",
                borderRight: 
                  selectedHoef === hoef.hoef_member_id ? "3px solid #1890ff" : "3px solid transparent",
                transition: "all 0.2s",
                display: "flex",
                alignItems: "center",
                gap: 12,
                direction: "rtl",
              }}
            >
              <div style={{
                width: 40,
                height: 40,
                borderRadius: "50%",
                backgroundColor: "#f0f0f0",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: 16,
                fontWeight: 600,
                color: "#666"
              }}>
                {hoef.name?.charAt(0) || "?"}
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 600, color: "#333" }}>
                  {hoef.name}
                </div>
                {hoef.role && (
                  <div style={{ fontSize: 12, color: "#999" }}>
                    {hoef.role}
                  </div>
                )}
              </div>
              {hoef.isAvailable && (
                <Tag color="green">זמין</Tag>
              )}
            </div>
          ))}
        </div>
      )}

      <div style={{ 
        display: "flex", 
        gap: 12, 
        justifyContent: "flex-end",
        direction: "rtl"
      }}>
        <Button onClick={() => { Modal.destroyAll(); onSelect(null); }}>
          לא, תודה
        </Button>
        <Button 
          type="primary" 
          onClick={handleConfirm}
          disabled={!selectedHoef}
        >
          שבץ לחופף
        </Button>
      </div>
    </div>
  );
};

// ==========================================
// 🎯 פונקציה לפתיחת המודל
// ==========================================

export interface AssignHoefModalProps {
  taskId: number;
  teamId: number;
  taskName: string;
}

export const showAssignHoefModal = async (
  props: AssignHoefModalProps,
  queryClient: any  // ← שיניתי ל-any במקום פונקציה
): Promise<{ hoefId: number } | null> => {
  // שליפת הנתונים מראש
  let hoefs: any[] = [];
  try {
    hoefs = await getHoefTeamSummary(props.teamId);
  } catch (error) {
    console.error("Failed to fetch hoefs:", error);
    hoefs = [];
  }

  return new Promise((resolve) => {
    Modal.confirm({
      title: (
        <div style={{ display: "flex", alignItems: "center", gap: 12, fontSize: 18, fontWeight: 600 }}>
          <TeamOutlined style={{ color: "#1890ff", fontSize: 24 }} />
          <span style={{ direction: "rtl" }}>שיבוץ לחופף</span>
        </div>
      ),
      content: (
        <AssignHoefModalContent 
          taskName={props.taskName}
          hoefs={hoefs}
          onSelect={resolve} 
        />
      ),
      footer: null,
      width: 500,
      centered: true,
      icon: null,
    });
  });
};

// Export הפונקציה לשליפת נתונים
export { getHoefTeamSummary };

export default AssignHoefModalContent;