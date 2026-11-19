import React, { useEffect, useRef, useState } from "react";
import style from "./CheckListForOverlap.module.css";
import threeIcon from "../../../../media/svg/material-symbols-lightlist-rounded.svg";
import { Button, Input, Tooltip } from "antd";
import { CloseOutlined, EditOutlined } from "@ant-design/icons";

interface ChecklistItem {
  id: number;
  todo: string;
}

interface ChecklistItems {
  id: number;
  text: string;
  isEditing: boolean;
}

type CheckListForOverlapProps = {
  width?: string;
  showHeader?: boolean;
  initialItems?: ChecklistItem[];
  onItemsChange?: (items: ChecklistItem[]) => void;
  setIsChange?: (value: boolean) => void;
};

const CheckListForOverlap: React.FC<CheckListForOverlapProps> = ({
  width = "38vw",
  showHeader = true,
  initialItems = [],
  onItemsChange,
  setIsChange,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [items, setItems] = useState<ChecklistItems[]>(() => {
    if (initialItems.length > 0) {
      return initialItems.map((item, index) => ({
        id: item.id || Date.now() + index,
        text: item.todo,
        isEditing: false,
      }));
    }
    return [];
  });

  // ════════════════════════════════════════════
  // עדכון סטייט כשה-prop משתנה
  // ════════════════════════════════════════════
  useEffect(() => {
    if (initialItems.length > 0 && items.length === 0) {
      setItems(
        initialItems.map((item, index) => ({
          id: item.id || Date.now() + index,
          text: item.todo,
          isEditing: false,
        }))
      );
    }
  }, [initialItems]);

  // ════════════════════════════════════════════
  // עדכון האב כשהרשימה משתנה
  // ════════════════════════════════════════════
  const notifyParent = (updatedItems: ChecklistItems[]) => {
    if (onItemsChange) {
      const plainItems: ChecklistItem[] = updatedItems
        .filter((item) => item.text.trim().length > 0) // ← הוסף
        .map((item) => ({
          id: item.id,
          todo: item.text,
        }));
      onItemsChange(plainItems);
    }
  };

  const addItem = () => {
    const newItem: ChecklistItems = {
      id: Date.now(),
      text: "",
      isEditing: true,
    };
    setItems((prev) => {
      const updated = prev?.length > 0 ? [...prev, newItem] : [newItem];
      notifyParent(updated);
      setIsChange?.(true);
      return updated;
    });
  };

  const updateItemValue = (id: number, text: string) => {
    setItems((prev) => {
      const updated = prev.map((item) =>
        item.id === id ? { ...item, text } : item
      );
      notifyParent(updated);
      setIsChange?.(true);
      return updated;
    });
  };

  const saveItem = (id: number) => {
    const itemToSave = items.find((item) => item.id === id);
    if (!itemToSave) return;

    if (itemToSave.text.trim() !== "") {
      setItems((prev) => {
        const updated = prev.map((item) =>
          item.id === id ? { ...item, isEditing: false } : item
        );
        notifyParent(updated);
        setIsChange?.(true);
        return updated;
      });
    } else {
      setItems((prev) => {
        const updated = prev.filter((item) => item.id !== id);
        notifyParent(updated);
        return updated;
      });
    }
  };

  const toggleEdit = (id: number) => {
    setItems((prev) =>
      prev.map((item) =>
        item.id === id ? { ...item, isEditing: !item.isEditing } : item
      )
    );
  };

  const removeOption = (id: number) => {
    setItems((prev) => {
      const updated = prev?.filter((item) => item.id !== id);
      notifyParent(updated);
      setIsChange?.(true);
      return updated;
    });
  };

  return (
    <div className={style.wrapper} ref={containerRef} style={{ width }}>
      {showHeader && (
        <div className={style.header}>
          <div className={style.header_text}>
            צ'ק ליסט חופף
            <Tooltip color="gray" title="הוספת מטלה">
              <Button
                className={style.addRowBtn}
                shape="circle"
                size="small"
                onClick={addItem}
              >
                <div style={{ marginBottom: "0.1vh" }}>+</div>
              </Button>
            </Tooltip>
          </div>
          <div className={style.header_logo}>
            <img
              src={threeIcon}
              style={{ width: "2.2rem", marginTop: "1vh" }}
              className={style.svgs}
            />
          </div>
        </div>
      )}

      <div className={style.content}>
        {items.map((item) => (
          <div
            key={item.id}
            className={style.rowLine}
            onClick={() => !item?.isEditing && toggleEdit(item.id)}
          >
            {!item.isEditing ? (
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  width: "100%",
                }}
              >
                <span
                  style={{
                    fontSize: "1rem",
                    fontWeight: "500",
                  }}
                >
                  {item.text.length > 50 ? (
                    <Tooltip title={item.text}>
                      <span>{item.text.substring(0, 50)}...</span>
                    </Tooltip>
                  ) : (
                    <span>{item.text}</span>
                  )}
                </span>

                <div style={{ display: "flex", gap: "8px" }}>
                  {/* <Tooltip color="gray" title="עריכת מטלה">
                    <Button
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleEdit(item.id);
                      }}
                      shape="circle"
                      size="small"
                      style={{ backgroundColor: "#d4c7ad" }}
                    >
                      <EditOutlined style={{ fontSize: "0.8rem" }} />
                    </Button>
                  </Tooltip> */}

                  <Tooltip color="gray" title="מחיקת מטלה">
                    <Button
                      onClick={(e) => {
                        e.stopPropagation();
                        removeOption(item.id);
                      }}
                      shape="circle"
                      size="small"
                      style={{ backgroundColor: "#ece5d6" }}
                    >
                      <div style={{ marginBottom: "0.3vh" }}>
                        <CloseOutlined style={{ fontSize: "0.7rem" }} />
                      </div>
                    </Button>
                  </Tooltip>
                </div>
              </div>
            ) : (
              <Input
                type="text"
                value={item.text}
                onChange={(e) => updateItemValue(item.id, e.target.value)}
                placeholder="כאן זה המקום להוסיף מטלה..."
                className={style.newRowInput}
                onKeyDown={(e) => e.key === "Enter" && saveItem(item.id)}
                onBlur={() => setTimeout(() => saveItem(item.id), 100)}
                autoFocus
              />
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default CheckListForOverlap;
