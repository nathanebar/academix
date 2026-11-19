import { Tooltip } from "antd";
import { EyeInvisibleOutlined } from "@ant-design/icons";
import React from "react";

interface HiddenBadgeProps {
  size?: number;
  bgColor?: string;
  borderColor?: string;
  tooltip?: string;
}

export const HiddenBadge = React.memo(
  ({
    size = 24,
    bgColor = "#fff3f0",
    borderColor = "#000000ff",
    tooltip = "משימה מוסתרת - החניך לא יראה משימה זו",
  }: HiddenBadgeProps) => (
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
          flexShrink: 0,
        }}
      >
        <EyeInvisibleOutlined style={{ fontSize: size * 0.55, color: "#000000ff" }} />
      </div>
    </Tooltip>
  )
);