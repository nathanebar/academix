// components/ContextMenu/ContextMenu.tsx
import React, { useState, useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { TeamOutlined, EditOutlined, DeleteOutlined } from "@ant-design/icons";
import { cssVar, radius } from "../../../../theme/tokens";

interface ContextMenuItem {
  key: string;
  label: string;
  icon?: React.ReactNode;
  danger?: boolean;
  onClick: () => void;
}

interface ContextMenuProps {
  items: ContextMenuItem[];
  x: number;
  y: number;
  onClose: () => void;
}

export const ContextMenu: React.FC<ContextMenuProps> = ({ items, x, y, onClose }) => {
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // סגירה בלחיצה מחוץ לתפריט
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        onClose();
      }
    };

    // סגירה בלחיצה על Escape
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };

    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleEscape);

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleEscape);
    };
  }, [onClose]);

  // מנע שהתפריט יצא מהמסך
  const adjustedX = Math.min(x, window.innerWidth - 200);
  const adjustedY = Math.min(y, window.innerHeight - items.length * 45);

  return createPortal(
    <div
      ref={menuRef}
      style={{
        position: "fixed",
        top: adjustedY,
        left: adjustedX,
        backgroundColor: cssVar("white"),
        borderRadius: radius.lg,
        boxShadow: "0 4px 12px rgba(0,0,0,0.15)", // TODO(tokens)
        padding: "6px 0",
        minWidth: 180,
        zIndex: 9999,
        direction: "rtl",
        overflow: "hidden",
      }}
    >
      {items.map((item) => (
        <div
          key={item.key}
          onClick={() => {
            item.onClick();
            onClose();
          }}
          style={{
            display: "flex",
            alignItems: "center",
            gap: 10,
            padding: "10px 16px",
            cursor: "pointer",
            transition: "background 0.15s",
            color: item.danger ? cssVar("antRed") : cssVar("grey333"),
            fontSize: 14,
            fontWeight: 500,
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = item.danger ? cssVar("antErrorBg") : "#f0f7ff"; // TODO(tokens): #f0f7ff
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = "transparent";
          }}
        >
          <span style={{ 
            color: item.danger ? cssVar("antRed") : cssVar("antBlue"),
            display: "flex",
            alignItems: "center",
            fontSize: 16
          }}>
            {item.icon}
          </span>
          {item.label}
        </div>
      ))}
    </div>,
    document.body
  );
};

export default ContextMenu;