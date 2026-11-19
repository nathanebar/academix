// SelectionDropdown.tsx
import React, { memo, useEffect, useRef } from "react";
import { CaretDownOutlined } from "@ant-design/icons";
import styles from "./HeaderPermissionDisplay.module.css";

import { usePermissionStore } from "../store/permissionStore";

interface Item {
  id: string | number;
  name: string;
}
interface SelectionDropdownProps {
  selected?: string;
  showDropdown: boolean;
  dropdownType: string | null;
  items: Item[];
  onItemClick: (item: Item) => void;
  toggleDropdown: (type: string) => void;
  type: keyof typeof PERMISSIONS;
  onHeaderClick: () => void;
  isActive?: boolean;
}

const PERMISSIONS: Record<string, string[]> = {
  domain: ["DOMAIN_MANAGER", "SYSTEM-ADMIN"],
  course: ["COURSE_COMMANDER", "DOMAIN_MANAGER", "SYSTEM-ADMIN"],
  team: [
    "TEAM_COMMANDER",
    "COURSE_COMMANDER",
    "DOMAIN_MANAGER",
    "SYSTEM-ADMIN",
    "OVERLAP",
  ],
  teamMembers: [
    "TEAM_COMMANDER",
    "COURSE_COMMANDER",
    "DOMAIN_MANAGER",
    "SYSTEM-ADMIN",
    "STUDENT",
    "OVERLAP",
  ],
  courseBatches: ["COURSE_COMMANDER", "DOMAIN_MANAGER", "SYSTEM-ADMIN"],
};

export const SelectionDropdown: React.FC<SelectionDropdownProps> = memo(
  ({
    selected,
    showDropdown,
    dropdownType,
    items,
    onItemClick,
    toggleDropdown,
    type,
    onHeaderClick,
    isActive = false,
  }) => {
    const containerRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
      if (!showDropdown || dropdownType !== type) return;

      const handleClickOutside = (event: MouseEvent) => {
        if (
          containerRef.current &&
          !containerRef.current.contains(event.target as Node)
        ) {
          toggleDropdown(type);
        }
      };

      document.addEventListener("mousedown", handleClickOutside);
      return () =>
        document.removeEventListener("mousedown", handleClickOutside);
    }, [showDropdown, dropdownType, type, toggleDropdown]);

    const role = usePermissionStore((s) => s.selectedPermission?.role_code);
    const path = location.pathname;

    const isFormPage =
      (path.includes("/forms") ||
        path.includes("/feedbackDashboard") ||
        path.includes("/calendar") ||
        path.includes("/survey") ||
        path.includes("/HoefOverview") ||
        path.includes("studentStatus")) &&
      (type === "courseBatches" || type === "course" || type === "domain");

    const hasAccess = PERMISSIONS[type]?.includes(role ?? "") ?? false;

    const PLACEHOLDERS = ["בחר צוות", "בחר חבר צוות"] as const;

    const labelCls = (enabled: boolean) =>
      `${enabled ? styles.permissionLabel : styles.permissionLabelNA} ${
        isActive ? styles.active : ""
      }`;

    if (items.length === 1) {
      const item = items[0];
      return (
        <div className={styles.permissionItem}>
          <span
            onClick={() =>
              hasAccess && !isFormPage && (onItemClick(item), onHeaderClick())
            }
            className={labelCls(hasAccess && !isFormPage)}
          >
            {item.name}
          </span>
          {type !== "teamMembers" && (
            <span style={{ fontSize: 30, marginRight: 10 }}>|</span>
          )}
        </div>
      );
    }

    if (items.length === 0) {
      const emptyText: Record<string, string> = {
        team: "אין צוותים",
        domain: "אין תחומים",
        course: "אין קורסים",
        courseBatches: "אין מחזורים",
      };
      return (
        <div className={styles.permissionItem}>
          <span className={labelCls(false)}>{emptyText[type] ?? ""}</span>
        </div>
      );
    }

    return (
      <div className={styles.permissionItem} ref={containerRef}>
        <span
          onClick={() =>
            !PLACEHOLDERS.includes(selected as (typeof PLACEHOLDERS)[number]) &&
            !isFormPage &&
            onHeaderClick()
          }
          className={labelCls(
            !!selected && selected !== "בחר צוות" && !isFormPage
          )}
        >
          {selected}
        </span>

        {role !== "STUDENT" && (
          <span
            className={styles.permissionCaretDownOutlined}
            onClick={() => toggleDropdown(type)}
          >
            <CaretDownOutlined />
          </span>
        )}

        {type !== "teamMembers" && <span style={{ fontSize: 30 }}>|</span>}

        {showDropdown && dropdownType === type && (
          <div className={styles.permissionDropdown}>
            {items.map((it) => (
              <div
                key={it.id}
                className={styles.dropdownItem}
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => (onItemClick(it), onHeaderClick())}
              >
                {it.name}
              </div>
            ))}
          </div>
        )}
      </div>
    );
  }
);
