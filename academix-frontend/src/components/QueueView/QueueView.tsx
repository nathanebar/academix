import React from "react";
import { Card, Tag, Empty, Tooltip } from "antd";
import { ClockCircleOutlined, UserOutlined, TeamOutlined, DeleteOutlined, CloseCircleOutlined, LockOutlined } from "@ant-design/icons";
import dayjs from "dayjs";
import { usePermissionStore } from "../../store/permissionStore";

interface QueueAssignment {
  id: number;
  taskAssignmentId: number;
  user_id: number;
  memberName?: string;
  createdAt: string;
}

interface QueueItem {
  taskId: number;
  taskName: string;
  taskColor: string;
  groupName?: string;
  assignmentsCount?: number;
  assignments?: QueueAssignment[];
  timeAgo?: string;
  exposure?: boolean;
  recommendedTime?: number;
  formId?: number;
}

interface QueueViewProps {
  queueTasks?: QueueItem[];
  onRemove?: (taskId: number) => void;
  onRemoveAssignment?: (taskAssignmentId: number) => void;
}

const QueueView: React.FC<QueueViewProps> = ({ 
  queueTasks = [], 
  onRemove,
  onRemoveAssignment 
}) => {
  const selectedPermission = usePermissionStore((s) => s.selectedPermission);


   const isStudent = selectedPermission?.role_code === 'STUDENT';

    if (isStudent) {
    return (
      <div style={{ padding: '16px' }}>
          <div style={{
        padding: "20px 24px",
        background: "#fff",
        borderBottom: "1px solid #e8e8e8",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
         
          <div>
            <h3 style={{ margin: 0, fontSize: "18px", fontWeight: 600 }}>
              תור המשימות
            </h3>
            <span style={{ fontSize: "13px", color: "#999" }}>
              {queueTasks.length} משימות בתור
            </span>
          </div>
        </div>
        
      </div>
      
        {queueTasks.map((item, index) => (
          <Card
            key={item.taskId || index}
            size="small"
            style={{
              marginBottom: '8px',
              borderRadius: '10px',
              borderRight: `4px solid ${item.taskColor || '#1890ff'}`,
            }}
            bodyStyle={{ padding: '12px 16px' }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
             
              <span style={{ fontWeight: 500, fontSize: '14px', color: '#262626' }}>
                {item.taskName}
              </span>
            </div>
          </Card>
        ))}
        
        {queueTasks.length === 0 && (
          <div style={{ 
            textAlign: 'center', 
            color: '#999', 
            padding: '40px 20px',
            fontSize: '13px'
          }}>
            אין משימות בתור
          </div>
        )}
      </div>
    );
  }

  return (
    <div style={{
      height: "100%",
      display: "flex",
      flexDirection: "column",
      background: "#f5f5f5",
      borderRadius: "12px",
      overflow: "hidden",
      fontFamily: "'Heebo', sans-serif",
    }}>
      {/* כותרת */}
      <div style={{
        padding: "20px 24px",
        background: "#fff",
        borderBottom: "1px solid #e8e8e8",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
         
          <div>
            <h3 style={{ margin: 0, fontSize: "18px", fontWeight: 600 }}>
              תור המשימות
            </h3>
            <span style={{ fontSize: "13px", color: "#999" }}>
              {queueTasks.length} משימות בתור
            </span>
          </div>
        </div>
        
      </div>

  
      <div style={{
        flex: 1,
        padding: "16px",
        overflowY: "auto",
      }}>
        {queueTasks.length === 0 ? (
          <div style={{
            height: "100%",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            color: "#999",
          }}>
           
            <p style={{ fontSize: "16px", fontWeight: 500, margin: 0 }}>
              התור ריק
            </p>
          </div>
        ) : (
        queueTasks.map((item, index) => (
  <Card
    key={item.taskId || index}
    size="small"
    hoverable
    style={{
      marginBottom: "12px",
      borderRadius: "12px",
      border: `1px solid ${item.taskColor || '#e0e0e0'}30`,
      boxShadow: "0 2px 8px rgba(0,0,0,0.04)",
      cursor: "pointer",
      transition: "all 0.2s ease",
      overflow: "hidden",
    }}
    styles={{
      body: { padding: "16px" }
    }}
  >
    {/* כותרת עם אפשרות מחיקה */}
    <div style={{
      display: "flex",
      alignItems: "flex-start",
      justifyContent: "space-between",
      marginBottom: "12px",
    }}>
      <div style={{ display: "flex", alignItems: "center", gap: "8px", flex: 1 }}>
        {/* קו צד ימני */}
        <div style={{
          width: "4px",
          height: "24px",
          backgroundColor: item.taskColor || '#1890ff',
          borderRadius: "2px",
          flexShrink: 0,
        }} />
        
        <div>
          <div style={{
            fontWeight: 600,
            fontSize: "15px",
            color: "#1a1a1a",
            lineHeight: 1.3,
          }}>
            {item.taskName}
          </div>
          
          {/* תגיות בשורה */}
          <div style={{
            display: "flex",
            alignItems: "center",
            gap: "6px",
            marginTop: "6px",
            flexWrap: "wrap",
          }}>
            {item.exposure && (
              <span style={{
                backgroundColor: "#fff7e6",
                color: "#fa8c16",
                fontSize: "11px",
                padding: "2px 8px",
                borderRadius: "4px",
                fontWeight: 500,
              }}>
                ⏱ Exposure
              </span>
            )}
            {item.assignmentsCount !== undefined && (
              <span style={{
                backgroundColor: "#e6f7ff",
                color: "#1890ff",
                fontSize: "11px",
                padding: "2px 8px",
                borderRadius: "4px",
                fontWeight: 500,
              }}>
                👥 {item.assignmentsCount} חניכים
              </span>
            )}
          </div>
        </div>
      </div>
      
      {/* כפתור מחיקה - רק אייקון קטן */}
      <Tooltip title="הורד מהתור">
        <span
          onClick={(e) => {
            e.stopPropagation();
            e.preventDefault();
            onRemove?.(item.taskId);
          }}
          style={{
            cursor: "pointer",
            color: "#bfbfbf",
            fontSize: "16px",
            padding: "4px",
            borderRadius: "4px",
            transition: "all 0.2s ease",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.color = "#ff4d4f";
            e.currentTarget.style.backgroundColor = "#fff1f0";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.color = "#bfbfbf";
            e.currentTarget.style.backgroundColor = "transparent";
          }}
        >
          <CloseCircleOutlined />
        </span>
      </Tooltip>
    </div>
    
    {/* קבוצה */}
    {item.groupName && (
      <div style={{
        fontSize: "12px",
        color: "#8c8c8c",
        display: "flex",
        alignItems: "center",
        gap: "6px",
        marginBottom: item.assignments?.length ? "12px" : "0",
      }}>
        <TeamOutlined style={{ fontSize: "12px" }} />
        {item.groupName}
      </div>
    )}
    
    {/* רשימת חניכים */}
    {item.assignments && item.assignments.length > 0 && (
      <div style={{
        borderTop: "1px solid #f5f5f5",
        paddingTop: "12px",
        marginTop: "4px",
      }}>
        <div style={{
          display: "flex",
          flexWrap: "wrap",
          gap: "6px",
        }}>
          {item.assignments.map((assignment) => (
            <Tag
              key={assignment.taskAssignmentId}
              style={{
                borderRadius: "16px",
                border: "1px solid #f0f0f0",
                backgroundColor: "#fafafa",
                padding: "2px 8px 2px 6px",
                display: "flex",
                alignItems: "center",
                gap: "4px",
                fontSize: "12px",
                color: "#595959",
                transition: "all 0.2s ease",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = "#ff4d4f40";
                e.currentTarget.style.backgroundColor = "#fff1f0";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = "#f0f0f0";
                e.currentTarget.style.backgroundColor = "#fafafa";
              }}
              closeIcon={
                <span
                  onClick={(e) => {
                    e.stopPropagation();
                    e.preventDefault();
                    onRemoveAssignment?.(assignment.taskAssignmentId);
                  }}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    color: "#bfbfbf",
                    fontSize: "12px",
                    marginRight: "2px",
                    transition: "color 0.2s ease",
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.color = "#ff4d4f";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.color = "#bfbfbf";
                  }}
                >
                  <CloseCircleOutlined />
                </span>
              }
              onClose={(e) => e.stopPropagation()}
            >
              <span style={{
                width: "18px",
                height: "18px",
                borderRadius: "50%",
                backgroundColor: "#d9d9d9",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: "10px",
                color: "#fff",
              }}>
                <UserOutlined style={{ fontSize: "10px" }} />
              </span>
              {assignment?.memberName}
            </Tag>
          ))}
        </div>
      </div>
    )}
  </Card>
))
        )}
      </div>
    </div>
  );
};

export default QueueView;