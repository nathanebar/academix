// components/Badges/HoefBadge.tsx
import { Tooltip, Avatar, Badge, Popconfirm, message } from "antd";
import { UserOutlined, TeamOutlined, DeleteOutlined } from "@ant-design/icons";
import React from "react";

interface HoefItem {
  id: number;
  taskAssignmentId: number;
  occurrence_id: number | null;
  source: string;
  team_member_id: number | null;
  hoef_name: string | null;
  hoef_username: string | null;
  hoef_image_url?: string | null;
  student_name?: string | null;
}

interface TaskWithHoef {
  task_id?: number;
  has_hoef?: boolean;
  hoef_name?: string | null;
  hoef_username?: string | null;
  hoef_image_url?: string | null;
  hoef_team_member_id?: number | null;
  student_name?: string | null;
  student_username?: string | null;
  // שדות נוספים של המשימה
  id?: string | number;
  name?: string;
  taskAssignmentId?: number;
  occurrence_id?: number | null;
  source?: string;
}

// 🆕 ממשק לקולבק הסרה
interface RemoveHoefPayload {
  taskAssignmentId: number;
  hoefTeamMemberId: number;
  occurrence_id?: number | null;
  source: string;
  studentName?: string | null;
  hoefName?: string | null;
}

interface HoefBadgeProps {
  creatorName?: string | null;
  assignerName?: string | null;
  items?: HoefItem[];
  size?: number;
  defaultHoefImageBaseUrl?: string;
  showDefaultWhenEmpty?: boolean;
  task?: TaskWithHoef | null;
  // 🆕 קולבק להסרת חופף
  onRemoveHoef?: (payload: RemoveHoefPayload) => void;
  // 🆕 האם להציג כפתור הסרה
  showRemoveButton?: boolean;
  // 🆕 צבע מותאם לכפתור הסרה
  removeButtonColor?: string;
}

export const HoefBadge = React.memo(
  ({ 
    creatorName, 
    assignerName, 
    items = [], 
    size = 24,
    defaultHoefImageBaseUrl = process.env.REACT_APP_API_BASE_URL,
    showDefaultWhenEmpty = false,
    task = null,
    onRemoveHoef,
    showRemoveButton = true,
    removeButtonColor = "#ff4d4f",
  }: HoefBadgeProps) => {
    
    // ═══════════════════════════════════════════════
    // 🎯 פונקציה לטיפול בהסרת חופף
    // ═══════════════════════════════════════════════
    const handleRemoveHoef = (payload: RemoveHoefPayload) => {
   
      if (onRemoveHoef) {
    
        onRemoveHoef(payload);
      }
    };

    // ═══════════════════════════════════════════════
    // 🎯 רינדור כפתור הסרה לפריט בודד
    // ═══════════════════════════════════════════════
    const renderRemoveButton = (
      payload: RemoveHoefPayload,
      hoefName?: string | null,
      studentName?: string | null
    ) => {
      if (!showRemoveButton || !onRemoveHoef) return null;

      return (
        <Popconfirm
          title="הסרת חופף"
          description={
            <div style={{ direction: "rtl", textAlign: "right" }}>
              <p>האם להסיר את <strong>{hoefName || "החופף"}</strong> ממשימה זו?</p>
              {studentName && (
                <p style={{ fontSize: 12, color: "#888" }}>
                  חניך: {studentName}
                </p>
              )}
            </div>
          }
          onConfirm={() => handleRemoveHoef(payload)}
          okText="הסר"
          cancelText="ביטול"
          okButtonProps={{ danger: true }}
          placement="left"
        >
          <button
            onClick={(e) => e.stopPropagation()}
            style={{
              background: "none",
              border: "none",
              cursor: "pointer",
              padding: "2px 4px",
              borderRadius: 4,
              color: removeButtonColor,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              transition: "all 0.2s",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = `${removeButtonColor}15`;
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = "transparent";
            }}
            title="הסר חופף"
          >
            <DeleteOutlined style={{ fontSize: 12 }} />
          </button>
        </Popconfirm>
      );
    };

    // ═══════════════════════════════════════════════
    // 🎯 מצב: משימה בודדת (single user view)
    // ═══════════════════════════════════════════════
    if (task) {
      const hasHoef = task.has_hoef === true && !!task.hoef_name;
      const hoefName = task.hoef_name;
      const hoefUsername = task.hoef_username;
      const hoefImageUrl = task.hoef_image_url;
      const studentName = task.student_name;
      const hoefTeamMemberId = task.hoef_team_member_id;

      // אין חופף
      if (!hasHoef) {
        if (!showDefaultWhenEmpty) {
          return null;
        }

        const tooltipTitle = assignerName
          ? `שובץ ע"״י – ${assignerName}`
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

      // יש חופף - מציגים את הבדג'
      const imageUrl = hoefImageUrl 
        || (hoefUsername 
          ? `${defaultHoefImageBaseUrl}/users/getUserPhoto/${hoefUsername}` 
          : null);

      const removePayload: RemoveHoefPayload = {
        taskAssignmentId: task.taskAssignmentId || 0,
        hoefTeamMemberId: hoefTeamMemberId || 0,
        occurrence_id: task.occurrence_id,
        source: task.source || "assignment",
        studentName,
        hoefName,
      };

      return (
        <Tooltip 
          title={
            <div style={{ direction: "rtl" }}>
              <div style={{ 
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                fontWeight: 600, 
                marginBottom: 8,
                borderBottom: "1px solid rgba(255,255,255,0.2)",
                paddingBottom: 6
              }}>
                <span> חופף על משימה</span>
                {renderRemoveButton(removePayload, hoefName, studentName)}
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <Avatar 
                  size={24}
                  src={imageUrl}
                  icon={<TeamOutlined />}
                  style={{ 
                    border: "1px solid rgba(255,255,255,0.3)",
                    backgroundColor: "#1890ff"
                  }}
                />
                <span style={{ fontWeight: 500 }}>{hoefName}</span>
              </div>
              {studentName && (
                <div style={{ 
                  fontSize: 11, 
                  color: "rgba(255,255,255,0.7)",
                  marginRight: 32,
                  marginTop: 4
                }}>
                  חניך: {studentName}
                </div>
              )}
            </div>
          }
        >
          <Avatar
            size={size}
            src={imageUrl}
            icon={!imageUrl && <TeamOutlined style={{ fontSize: size * 0.5 }} />}
            style={{
              border: "2px solid #1890ff",
              cursor: "pointer",
              backgroundColor: imageUrl ? undefined : "#1890ff",
            }}
          />
        </Tooltip>
      );
    }

    // ═══════════════════════════════════════════════
    // 🎯 מצב: רשימת משימות (team view)
    // ═══════════════════════════════════════════════
    const hoefItems = items.filter(item => item.hoef_name);
    const hoefCount = hoefItems.length;
    
    if (hoefCount === 0) {
      if (!showDefaultWhenEmpty) {
        return null;
      }
      
      const tooltipTitle = assignerName
        ? `שובץ ע"״י – ${assignerName}`
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

    const firstHoef = hoefItems[0];
    const imageUrl = firstHoef.hoef_image_url 
      || (firstHoef.hoef_username 
        ? `${defaultHoefImageBaseUrl}/users/getUserPhoto/${firstHoef.hoef_username}` 
        : null);

    return (
      <Tooltip 
        title={
          <div style={{ direction: "rtl" }}>
            <div style={{ 
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              fontWeight: 600, 
              marginBottom: 8,
              borderBottom: "1px solid rgba(255,255,255,0.2)",
              paddingBottom: 6
            }}>
              <span>חופפים על משימה ({hoefCount})</span>
            </div>
            {hoefItems.map((item, index) => {
              const removePayload: RemoveHoefPayload = {
                taskAssignmentId: item.taskAssignmentId,
                hoefTeamMemberId: item.team_member_id || 0,
                occurrence_id: item.occurrence_id,
                source: item.source,
                studentName: item.student_name,
                hoefName: item.hoef_name,
              };

              const itemImageUrl = item.hoef_image_url 
                || (item.hoef_username 
                  ? `${defaultHoefImageBaseUrl}/users/getUserPhoto/${item.hoef_username}` 
                  : null);

              return (
                <div 
                  key={item.id} 
                  style={{ 
                    display: "flex", 
                    flexDirection: "column", 
                    gap: 2, 
                    padding: "4px 0",
                    borderBottom: index < hoefCount - 1 ? "1px dashed rgba(255,255,255,0.1)" : "none"
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <Avatar 
                      size={20}
                      src={itemImageUrl}
                      icon={<TeamOutlined />}
                      style={{ 
                        border: "1px solid rgba(255,255,255,0.3)",
                        backgroundColor: "#1890ff"
                      }}
                    />
                    <span style={{ fontWeight: 500 }}>{item.hoef_name}</span>
                    {renderRemoveButton(removePayload, item.hoef_name, item.student_name)}
                  </div>
                  {item.student_name && (
                    <div style={{ 
                      fontSize: 11, 
                      color: "rgba(255,255,255,0.7)",
                      marginRight: 28
                    }}>
                      חניך: {item.student_name}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        }
      >
     
          <Avatar
            size={size}
            src={imageUrl}
            icon={!imageUrl && <TeamOutlined style={{ fontSize: size * 0.5 }} />}
            style={{
              border: "2px solid #1890ff",
              cursor: "pointer",
              backgroundColor: imageUrl ? undefined : "#1890ff",
            }}
          />
      
      </Tooltip>
    );
  }
);

// ==========================================
// 🎯 גרסה עם רשימת תמונות
// ==========================================

interface HoefAvatarGroupProps {
  items: HoefItem[];
  size?: number;
  maxCount?: number;
  onRemoveHoef?: (payload: RemoveHoefPayload) => void;
  showRemoveButton?: boolean;
}

export const HoefAvatarGroup: React.FC<HoefAvatarGroupProps> = ({
  items,
  size = 24,
  maxCount = 3,
  onRemoveHoef,
  showRemoveButton = true,
}) => {
  const hoefItems = items.filter(item => item.hoef_name);
  const hoefCount = hoefItems.length;
  
  if (hoefCount === 0) {
    return null;
  }

  const visibleItems = hoefItems.slice(0, maxCount);
  const remainingCount = hoefCount - maxCount;

  const getImageUrl = (username: string | null, imageUrl: string | null) => {
    if (imageUrl) return imageUrl;
    if (username) return `${process.env.REACT_APP_API_BASE_URL}/users/getUserPhoto/${username}`;
    return null;
  };

  const renderRemoveButton = (item: HoefItem) => {
    if (!showRemoveButton || !onRemoveHoef) return null;

    const removePayload: RemoveHoefPayload = {
      taskAssignmentId: item.taskAssignmentId,
      hoefTeamMemberId: item.team_member_id || 0,
      occurrence_id: item.occurrence_id,
      source: item.source,
      studentName: item.student_name,
      hoefName: item.hoef_name,
    };

    return (
      <Popconfirm
        title="הסרת חופף"
        description={
          <div style={{ direction: "rtl", textAlign: "right" }}>
            <p>האם להסיר את <strong>{item.hoef_name}</strong> ממשימה זו?</p>
            {item.student_name && (
              <p style={{ fontSize: 12, color: "#888" }}>
                חניך: {item.student_name}
              </p>
            )}
          </div>
        }
        onConfirm={() => onRemoveHoef(removePayload)}
        okText="הסר"
        cancelText="ביטול"
        okButtonProps={{ danger: true }}
        placement="left"
      >
        <button
          style={{
            position: "absolute",
            top: -4,
            right: -4,
            background: "#ff4d4f",
            border: "none",
            borderRadius: "50%",
            width: 16,
            height: 16,
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            color: "white",
            fontSize: 10,
          }}
          title="דבדדבדב"
        >
          ×
        </button>
      </Popconfirm>
    );
  };

  return (
    <Tooltip
      title={
        <div style={{ direction: "rtl" }}>
          <div style={{ 
            fontWeight: 600, 
            marginBottom: 8,
            borderBottom: "1px solid rgba(255,255,255,0.2)",
            paddingBottom: 6
          }}>
            חופפים ({hoefCount})
          </div>
          {hoefItems.map((item, index) => (
            <div 
              key={item.id} 
              style={{ 
                display: "flex", 
                flexDirection: "column", 
                gap: 2, 
                padding: "4px 0",
                borderBottom: index < hoefCount - 1 ? "1px dashed rgba(255,255,255,0.1)" : "none"
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <TeamOutlined style={{ color: "#52c41a" }} />
                <span>{item.hoef_name}</span>
                {showRemoveButton && onRemoveHoef && (
                  <Popconfirm
                    title="הסרת חופף"
                    description={`האם להסיר את ${item.hoef_name}?`}
                    onConfirm={() => onRemoveHoef({
                      taskAssignmentId: item.taskAssignmentId,
                      hoefTeamMemberId: item.team_member_id || 0,
                      occurrence_id: item.occurrence_id,
                      source: item.source,
                      studentName: item.student_name,
                      hoefName: item.hoef_name,
                    })}
                    okText="הסר"
                    cancelText="ביטול"
                    okButtonProps={{ danger: true }}
                    placement="left"
                  >
                    <DeleteOutlined 
                      style={{ 
                        color: "#ff4d4f", 
                        cursor: "pointer",
                        marginRight: 8,
                      }} 
                    />
                  </Popconfirm>
                )}
              </div>
              {item.student_name && (
                <div style={{ 
                  fontSize: 11, 
                  color: "rgba(255,255,255,0.7)",
                  marginRight: 28
                }}>
                  חניך: {item.student_name}
                </div>
              )}
            </div>
          ))}
        </div>
      }
    >
      <Avatar.Group
        maxCount={maxCount}
        size={size}
        maxStyle={{
          backgroundColor: "#1890ff",
          color: "#fff",
          cursor: "pointer",
          border: "2px solid #e6f7ff"
        }}
      >
        {visibleItems.map((item) => (
          <div key={item.id} style={{ position: "relative" }}>
            {renderRemoveButton(item)}
            <Avatar
              src={getImageUrl(item.hoef_username, item?.hoef_image_url || null)}
              icon={<TeamOutlined />}
              style={{ 
                border: "2px solid #e6f7ff",
                backgroundColor: "#1890ff"
              }}
            />
          </div>
        ))}
      </Avatar.Group>
    </Tooltip>
  );
};

export default HoefBadge;