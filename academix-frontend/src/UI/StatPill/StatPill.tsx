import React, { useState } from "react";
import { Gradient, schemaMap, SchemaName } from "../../types/types";
import { Dropdown, Popconfirm, Tag, Tooltip } from "antd";
import { MoreOutlined, LockOutlined, TeamOutlined } from "@ant-design/icons";
import { ItemType } from "antd/lib/menu/interface";
import { useSelectionsStore } from "../../store/selectionStore";
import { useItemLockStatus } from "../../hooks/useItemLockStatus";
import { usePermissionStore } from "../../store/permissionStore";
import AddAxisForm from "../../components/Axis/AxisBoard/addAxisForm/AddAxisForm";
import { updateAxis } from "../../services/ApiServices";
import { useQueryClient } from "@tanstack/react-query";
import stringCheckAndToolTip from "../../utils/stringCheck";
import { cssVar } from "../../theme/tokens";

type Props = {
  axisId: number;
  label?: string;
  count?: number;
  scheme?: SchemaName | Gradient;
  start: boolean;
  canModify: boolean;
  filterOption: string;
  handleDeleteAxis: (axisId: number) => void;
  handleArchivedAxis: (axisId: number, newStatus: string) => void;
  teamId?: number | null;
  isLocked?: boolean;
  handleEditTemplate: any;
  onAxisNameChange?: (newName: string) => void;
};

const baseStyle: React.CSSProperties = {
  padding: "8px 16px",
  borderRadius: "9999px", // TODO(tokens): radius.pill is 999px, not the same value
  color: cssVar("white"),
  fontWeight: "bold",
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "space-between",
  minWidth: 230,
  gap: 10,
};

const StatPill = ({
  axisId,
  label,
  count,
  scheme,
  start,
  canModify,
  filterOption,
  handleDeleteAxis,
  handleArchivedAxis,
  teamId,
  isLocked: explicitLockStatus,
  handleEditTemplate,
  onAxisNameChange,
}: Props) => {
  const gradient = typeof scheme === "string" ? schemaMap[scheme] : scheme;
  const { isLocked, getIndicatorType } = useItemLockStatus();
  const shouldBeLocked = explicitLockStatus ?? isLocked(teamId ?? null);
  const { selectedPermission, permissions } = usePermissionStore();
  const queryClient = useQueryClient();
  const [isEditingAxis, setIsEditingAxis] = useState(false);
  const [editAxisName, setEditAxisName] = useState(label || "");
  const [editAxisColor, setEditAxisColor] = useState<SchemaName>(
    typeof scheme === "string" ? (scheme as SchemaName) : "coral"
  );



  
  const hasTemplatePermission = permissions.some(
    (p) => p.role_code === "SYSTEM-ADMIN" || p.role_code === "DOMAIN_MANAGER" 
    || p.role_code === "TEAM_COMMANDER" || p.role_code === "OVERLAP"  
  );



  const indicatorType = getIndicatorType(teamId ?? null);

  const getStyleByOption = (filterOption: string): React.CSSProperties => {
    const backgroundStyles: Record<string, string> = {
      operational: gradient
        ? `linear-gradient(to right, ${gradient.from}, ${gradient.to})`
        : "none",
      assignment_bank: "#3a547f", // TODO(tokens)
      archives: "#917c57", // TODO(tokens)
    };
    return {
      ...baseStyle,
      background: backgroundStyles[filterOption] || "none",
    };
  };
  const style = getStyleByOption(filterOption);

  const { activeHeaderType, selectedCourseBatch } = useSelectionsStore();

  const handleSaveEditAxis = async () => {
    if (editAxisName.trim().length === 0) {
      return;
    }
    try {
      await updateAxis(axisId, {
        name: editAxisName.trim(),
        color: editAxisColor,
        batch_id: selectedCourseBatch.id,
      });

      if (onAxisNameChange) {
        onAxisNameChange(editAxisName.trim());
      }

      setIsEditingAxis(false);

      queryClient.invalidateQueries({
        queryKey: ["AxisBatch"],
      });
    } catch (error) {
      console.error("Error updating axis:", error);
    }
  };
  const handleCancelEditAxis = () => {
    setEditAxisName(label || "");
    setEditAxisColor(
      typeof scheme === "string" ? (scheme as SchemaName) : "coral"
    );
    setIsEditingAxis(false);
  };

  if (isEditingAxis) {
    return (
      <AddAxisForm
        onAddAxis={handleSaveEditAxis}
        onCancel={handleCancelEditAxis}
        newAxisName={editAxisName}
        setNewAxisName={setEditAxisName}
        selectedColor={editAxisColor}
        setSelectedColor={setEditAxisColor}
        onSave={handleSaveEditAxis}
      />
    );
  }

  const getItemsForFilter = (filterOption: string): ItemType[] => {
    const isHighHierarchy = indicatorType === "manager";

    const baseItems: Record<string, Omit<ItemType, "key">> = {
      editAxis: {
        label: "עריכת ציר",
        style: { borderBottom: `1px solid ${cssVar("antGray4")}` },
        onClick: () => setIsEditingAxis(true),
      },
      archive: {
        label: (
          <Popconfirm
            title="הזהרה"
            description="קחו בחשבון שהעברה יפעל על כל התוכן של הציר שנמצא במאגר משימות וגם באופליין"
            okText="להעביר"
            cancelText="לא להעביר"
            onConfirm={() => handleArchivedAxis(axisId, "archives")}
          >
            <span>העברה לארכיון</span>
          </Popconfirm>
        ),
        style: { borderBottom: `1px solid ${cssVar("antGray4")}` },
      },
      operational: {
        label: "העברה למאגר משימות",
        style: { borderBottom: `1px solid ${cssVar("antGray4")}` },
        onClick: () => handleArchivedAxis(axisId, "operational"),
      },
      bank: {
        label: "העברה לאופליין",
        style: { borderBottom: `1px solid ${cssVar("antGray4")}` },
        onClick: () => handleArchivedAxis(axisId, "assignment_bank"),
      },
      ...(1 && {
        delete: {
          label: (
            <Popconfirm
              title={
                isHighHierarchy
                  ? "אזהרה! פעולה קריטית"
                  : "האם אתה בטוח שברצונך למחוק את הציר?"
              }
              description={
                isHighHierarchy ? (
                  <div>
                    <p style={{ margin: 0, fontWeight: 600, color: cssVar("antRed") }}>
                      ⚠️ אתה עומד למחוק ציר שנוצר בהיררכיה גבוהה!
                    </p>
                    <p style={{ margin: 0, fontWeight: 600, color: cssVar("antRed") }}>
                      המשמעות שהציר ימחק עם כל התוכן שלו מכל הצוותים במחזור
                      הקיים !!!
                    </p>
                    <p style={{ margin: "8px 0 0 0", fontSize: 13 }}>
                      פעולה זו תשפיע על כל התוכן והמשימות המקושרות לציר זה.
                    </p>
                    <p style={{ margin: "8px 0 0 0", fontSize: 13 }}>
                      פעולה זו לא ניתנת לביטול ותגרום לאובדן נתונים.
                    </p>
                  </div>
                ) : (
                  "פעולה זו לא ניתנת לביטול"
                )
              }
              okText={isHighHierarchy ? "אני מבין, מחק" : "כן, מחק"}
              okButtonProps={isHighHierarchy ? { danger: true } : undefined}
              cancelText="ביטול"
              onConfirm={() => handleDeleteAxis(axisId)}
              placement="bottom"
            >
              <div style={{ color: "red" }}>מחיקה</div>
            </Popconfirm>
          ),
          style: { borderBottom: `1px solid ${cssVar("antGray4")}` },
        },
      }),
      ...(hasTemplatePermission && {
        tamplate: {
          label: "עריכת טמפלייט משימה",
          style: { borderBottom: `1px solid ${cssVar("antGray4")}` },
          onClick: () => handleEditTemplate(axisId),
        },
      }),
    };

    const itemMap: Record<string, string[]> = {
      archives: ["editAxis", "operational", "bank", "delete", "tamplate"],
      operational: ["editAxis", "archive", "bank", "delete", "tamplate"],
      assignment_bank: [
        "editAxis",
        "archive",
        "operational",
        "delete",
        "tamplate",
      ],
    };

    const keys = itemMap[filterOption];
    return keys.map((key) => ({
      key,
      ...baseItems[key],
    }));
  };

  const items: ItemType[] | undefined = getItemsForFilter(filterOption);

  const renderIndicator = () => {
    if (indicatorType === "manager") {
      if (activeHeaderType !== "teamMember") {
        return null;
      }
      return (
        <Tooltip title="ציר שנוצר בהיררכית הקהדייה ולא ניתן לעריכה">
          <Tag
            icon={<LockOutlined />}
            color="default"
            style={{
              background: "transparent",
              border: "none",
              color: cssVar("white"),
              cursor: "default",
            }}
          ></Tag>
        </Tooltip>
      );
    }
    if (indicatorType === "team") {
      return (
        <Tooltip title="ציר שנוצר בהירכיית הצוות">
          <Tag
            icon={<TeamOutlined />}
            color="default"
            style={{
              background: "transparent",
              border: "none",
              color: cssVar("white"),
              cursor: "default",
            }}
          ></Tag>
        </Tooltip>
      );
    }
    return null;
  };

  return (
    <div style={style}>
      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
        <span>{stringCheckAndToolTip(label,20)}</span>
        {renderIndicator()}
      </div>
      {canModify &&
        /*  !start && */ /* hasPermissionToDeleteAxes && */
        activeHeaderType != "teamMember" &&
        !shouldBeLocked && (
          <Dropdown
            placement="bottomLeft"
            menu={{
              items: items,
            }}
            trigger={["click"]}
          >
            <div>
              <MoreOutlined
                style={{
                  cursor: "pointer",
                  fontSize: "16px",
                  fontWeight: "bold",
                }}
              />
            </div>
          </Dropdown>
        )}
      {shouldBeLocked &&
        canModify &&
        // !start &&
        activeHeaderType != "teamMember" && (
          <Tooltip title="פריט זה נעול - נוצר בהיררכיה גבוה">
            <LockOutlined
              style={{
                cursor: "not-allowed",
                fontSize: "16px",
                opacity: 0.7,
              }}
            />
          </Tooltip>
        )}
    </div>
  );
};

export default StatPill;
