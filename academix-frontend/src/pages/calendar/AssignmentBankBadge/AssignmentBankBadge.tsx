// src/components/Calendar/AssignmentBankBadge.tsx
import { Tooltip } from "antd";
import { DatabaseOutlined } from "@ant-design/icons";
import React from "react";

interface AssignmentBankBadgeProps {
  size?: number;
  bgColor?: string;
  borderColor?: string;
  tooltip?: string;
}
export const AssignmentBankBadge = React.memo(
  ({
    size = 24,
    bgColor = "#d0eaff",
    borderColor = "#d9d9d9",
    tooltip = "משימה מתוך אופליין אישי",
  }: AssignmentBankBadgeProps) => (
    <Tooltip title={tooltip}>
      <div
        style={{
          width: size,
          height: size,
          borderRadius: "50%",
          backgroundColor: bgColor,
          border: `1px solid ${borderColor}`,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          cursor: "pointer",
        }}
      >
        <DatabaseOutlined style={{ fontSize: size * 0.55, color: "#555" }} />
      </div>
    </Tooltip>
  )
);