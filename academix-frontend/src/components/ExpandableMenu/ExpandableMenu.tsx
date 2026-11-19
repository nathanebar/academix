import React, { useState } from "react";
import { Tooltip } from "antd";
import { BgColorsOutlined, LockOutlined, DragOutlined, MoreOutlined } from "@ant-design/icons";
import { Button } from "antd";
import "./ExpandableMenu.css";

interface ExpandableMenuProps {
  isBlockColorEnabled: boolean;
  onToggleBlockColor: () => void;
  isDragMode: boolean;
  onToggleDragMode: () => void;
  isLoading?: boolean;
  disabled?: boolean;
}

const ExpandableMenu: React.FC<ExpandableMenuProps> = ({
  isBlockColorEnabled,
  onToggleBlockColor,
  isDragMode,
  onToggleDragMode,
  isLoading,
  disabled,
}) => {
  const [isExpanded, setIsExpanded] = useState(false);

  const toggleExpand = () => {
    setIsExpanded(!isExpanded);
  };

  const menuItems = [
    {
      key: "blockColor",
      icon: <BgColorsOutlined />,
      label: isBlockColorEnabled ? "ביטול חסימת צבע לחניך" : "חסימת צבע לחניך",
      onClick: onToggleBlockColor,
      isActive: isBlockColorEnabled,
      color: "#ff4d4f",
      position: { bottom: 110, right: 0 },
    },
    {
      key: "dragMode",
      icon: <DragOutlined />,
      label: isDragMode ? "ביטול גרירה" : "מצב גרירה",
      onClick: onToggleDragMode,
      isActive: isDragMode,
      color: "#1890ff",
      position: { bottom: 180, right: 110 },
    },
  ];

  return (
    <div className="expandable-menu">
      {/* כפתורים שמתרחבים */}
      <div className={`expandable-items ${isExpanded ? "expanded" : ""}`}>
        {menuItems.map((item, index) => (
          <div
            key={item.key}
            className={`expandable-item item-${index + 1} ${isExpanded ? "visible" : ""}`}
            style={item.position}
          >
            <Tooltip title={item.label} placement="left">
              <Button
                type="text"
                onClick={() => {
                  item.onClick();
                  setIsExpanded(false);
                }}
                loading={isLoading && item.key === "blockColor"}
                className={`expandable-button ${item.isActive ? "active" : ""}`}
                style={{
                  backgroundColor: item.isActive 
                    ? `${item.color}15` 
                    : "#ffffff",
                  border: item.isActive 
                    ? `2px solid ${item.color}` 
                    : "1px solid #d9d9d9",
                  boxShadow: item.isActive 
                    ? `0 4px 12px ${item.color}40` 
                    : "0 2px 8px rgba(0, 0, 0, 0.1)",
                }}
              >
                <span style={{ color: item.isActive ? item.color : "#595959" }}>
                  {item.icon}
                </span>
                {item.isActive && item.key === "blockColor" && (
                  <span className="lock-badge">
                    <LockOutlined style={{ fontSize: "0.6rem", color: "#fff" }} />
                  </span>
                )}
              </Button>
            </Tooltip>
            <span className="expandable-label" style={{ color: item.isActive ? item.color : "#595959" }}>
              {item.label}
            </span>
          </div>
        ))}
      </div>

      {/* כפתור ראשי */}
      <Tooltip title={isExpanded ? "סגירה" : "אפשרויות נוספות"} placement="left">
        <Button
          type="primary"
          onClick={toggleExpand}
          className={`main-button ${isExpanded ? "rotated" : ""}`}
          style={{
            position: "fixed",
            bottom: 30,
            right: 30,
            width: 56,
            height: 56,
            borderRadius: 16,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            boxShadow: "0 4px 16px rgba(29, 30, 41, 0.4)",
            background: "linear-gradient(135deg, #111314 0%, #292f36 100%)",
          }}
        >
          <MoreOutlined
            style={{
              fontSize: "1.5rem",
              color: "#fff",
              transform: isExpanded ? "rotate(90deg)" : "rotate(0deg)",
              transition: "transform 0.3s ease",
            }}
          />
        </Button>
      </Tooltip>
    </div>
  );
};

export default ExpandableMenu;