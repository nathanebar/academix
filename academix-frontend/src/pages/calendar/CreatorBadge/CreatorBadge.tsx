import { Tooltip, Avatar } from "antd";
import { UserOutlined } from "@ant-design/icons";
import React from "react";

interface CreatorBadgeProps {
  creatorName?: string | null;
  assignerName?: string | null;
  size?: number;
}

export const CreatorBadge = React.memo(
  ({ creatorName, assignerName, size = 24 }: CreatorBadgeProps) => {
    const tooltipTitle = assignerName
      ? `שובץ ע״י – ${assignerName}`
      : creatorName
        ? `יוצר המשימה – ${creatorName}`
        : null;

    return (
      <Tooltip title={tooltipTitle}>
        <Avatar
          size={size}
          icon={<UserOutlined style={{ fontSize: size * 0.55 }} />}
          style={{
            border: "1px solid #d9d9d9",
            cursor: "pointer",
          }}
        />
      </Tooltip>
    );
  }
);