import React, { useEffect, useRef, useState, useMemo } from "react";
import style from "./CheckList.module.css";
import editIcon from "../../../../media/svg/Edit Icon.svg";
import threeIcon from "../../../../media/svg/material-symbols-lightlist-rounded.svg";
import { Button, Input, Tooltip, notification } from "antd";
import { assertOk } from "../../../../utils/httpStatus";
import { CheckOutlined, CloseOutlined } from "@ant-design/icons";
import { useTaskStore } from "../../../../store/taskStore";
import {
  updateMissionCompleted,
  removeMissionCompleted,
} from "../../../../services/ApiServices";

interface ChecklistItems {
  id: number;
  text: string;
  checked: boolean;
  isEditing: boolean;
  progress_id?: number;
  completed_at?: Date | string | null;
}

type CheckListProps = {
  userRole: "admin" | "user";
  todos?: any;
  // todos?: any;
  width?: string;
  setIsCompleted?: (item: any) => void;
  setIsNotCompleted?: (item: any) => void;
  // onAllMissionCompleted?: () => void;
  setCheckLists?: any;
  checkLists?: any;
  lock?: boolean;
  showHeader?: boolean;
  setIsChange?: any;
  locked?: boolean | undefined;
  isPreview?: boolean;
};

const CheckList = (props: CheckListProps) => {
  const taskInStore = useTaskStore((state) => state.task);
  const setTaskInStore = useTaskStore((state) => state.updateTask);
  const containerRef = useRef<HTMLDivElement>(null);
  const [items, setItems] = useState<ChecklistItems[]>([]);
  const [numMissions, setNumMissions] = useState<number>(0);
  const [numMissionsCompleted, setNumMissionsCompleted] = useState<number>(0);
  const [percentCompleted, setPercentCompleted] = useState<number>(0);

  useEffect(() => {
    const total = props.checkLists?.length ?? 0;
    const completed =
      props.checkLists?.filter((i: any) => i.completed_at != null).length ?? 0;

    setNumMissions(total);
    setNumMissionsCompleted(completed);

    const percent = total === 0 ? 0 : Math.round((completed / total) * 100);
    setPercentCompleted(percent);
  }, [props?.checkLists]);

  const sortedItems = useMemo(() => {
    return [...items].sort((a, b) => a.id - b.id);
  }, [items]);

  const completedMission = async (itemWithProgress: ChecklistItems) => {
    // ════════════════════════════════════════════
    // תיקון: להשתמש ב-progress_id, לא ב-id
    // ════════════════════════════════════════════

    const missionId = itemWithProgress.progress_id || itemWithProgress.id;

    // Optimistic (#17): marked right away, rolled back if the server refuses. Before, the item was
    // marked done even when the request failed (updateMissionCompleted returns error.response).
    const previousCompletedAt = itemWithProgress.completed_at ?? null;
    setItemCompletedAt(itemWithProgress.id, new Date());
    props.setIsCompleted?.(itemWithProgress.id); // מעביר id לקומפוננטה האב

    try {
      assertOk(await updateMissionCompleted(missionId));
    } catch {
      setItemCompletedAt(itemWithProgress.id, previousCompletedAt);
      props.setIsNotCompleted?.(itemWithProgress.id);
      notification.error({ message: "סימון הביצוע לא נשמר", placement: "top" });
    }
  };
  const removeMission = async (item: ChecklistItems) => {
    // ════════════════════════════════════════════
    // תיקון: להשתמש ב-progress_id, לא ב-id
    // ════════════════════════════════════════════
    const missionId = item.progress_id || item.id;

    // Optimistic (#17): unmarked right away, rolled back if the server refuses.
    const previousCompletedAt = item.completed_at ?? null;
    setItemCompletedAt(item.id, null);
    props.setIsNotCompleted?.(item.id); // מעביר id לקומפוננטה האב

    try {
      assertOk(await removeMissionCompleted(missionId));
    } catch {
      setItemCompletedAt(item.id, previousCompletedAt);
      props.setIsCompleted?.(item.id);
      notification.error({ message: "ביטול הסימון לא נשמר", placement: "top" });
    }
  };

  // completed_at of one checklist item, in the parent's list
  function setItemCompletedAt(itemId: number, completedAt: Date | string | null) {
    props.setCheckLists((prev: any) =>
      prev.map((checkItem: any) =>
        checkItem.id === itemId ? { ...checkItem, completed_at: completedAt } : checkItem
      )
    );
  }
  useEffect(() => {
    // Only sync to store if items have changed
    if (items.length >= 0) {
      const checkListForStore = items
        .filter((item) => item.text.trim().length > 0)
        .map((element) => ({
          toDo: element.text,
          done: element.checked,
        }));

      const currentCheckList = taskInStore.checkList || [];
      const hasChanged =
        JSON.stringify(checkListForStore) !== JSON.stringify(currentCheckList);

      if (true) {
        setTaskInStore({ ...taskInStore, checkList: checkListForStore });
      }
    }

    // Scroll to last item after adding new item
    if (containerRef.current) {
      const newRows = containerRef.current.querySelectorAll(
        '[class*="newRowWrapper"]'
      );
      if (newRows.length > 0) {
        newRows[newRows.length - 1].scrollIntoView({ behavior: "smooth" });
      }
    }
  }, [items]);

  useEffect(() => {
    const isUser = props.userRole === "user";

    if (props.todos && props.todos?.length > 0) {
      let idCounter = 0;
      const newOptions = props.todos.map((t: any) => {
        if (t?.todo?.trim().length == 0) return;
        idCounter += 1;
        return isUser
          ? {
              id: t.id,
              text: t.todo,
              checked: false,
              isEditing: false,
            }
          : {
              id: idCounter,
              text: props?.lock ? t.todo : t,
              checked: false,
              isEditing: false,
            };
      });

      // רק למנהל/חופף – מוסיפים שורה ריקה להוספת מטלה חדשה
      if (!isUser) {
        newOptions.push({
          id: Date.now(),
          text: "",
          isEditing: true,
          checked: false,
        });
      }

      setItems(newOptions);
    } else {
      // אם אין מטלות ולמשתמש – לא להציג שום שורה
      if (!isUser) {
        setItems([
          {
            id: Date.now(),
            text: "",
            isEditing: true,
            checked: false,
          },
        ]);
      } else {
        setItems([]);
      }
    }
  }, []);

  const addItem = () => {
    const newItem: ChecklistItems = {
      id: Date.now(),
      text: "",
      isEditing: true,
      checked: false,
    };
    setItems((prev) => (prev?.length > 0 ? [...prev, newItem] : [newItem]));
    props.setIsChange(true);
  };

  const updateItemValue = (id: number, text: string) => {
    setItems(items.map((item) => (item.id === id ? { ...item, text } : item)));
    props.setIsChange(true);
  };

  const saveItem = (id: number) => {
    const itemToSave = items.find((item) => item.id === id);
    if (!itemToSave) return;

    // Handle saving - don't remove empty items that are newly created
    if (itemToSave.text.trim() !== "") {
      setItems((prev) =>
        prev.map((item) =>
          item.id === id ? { ...item, isEditing: false } : item
        )
      );
      addItem();
    } else {
      // Only remove if it's truly empty AND not a newly created item
      // Or if it was already empty before editing started
      setItems((prev) => prev.filter((item) => item.id !== id));
    }
  };

  const toggleOption = (id: number) => {
    setItems(
      items.map((item) =>
        item.id === id ? { ...item, checked: !item.checked } : item
      )
    );
  };

  const toggleEdit = (id: number) => {
    setItems((prevItems) =>
      prevItems.map((item) =>
        item.id === id ? { ...item, isEditing: !item.isEditing } : item
      )
    );
  };

  const removeOption = (id: number) => {
    setItems((prev) => prev?.filter((i) => i?.id !== id));
    props.setIsChange(true);
  };

  return (
    <div
      className={style.wrapper}
      ref={containerRef}
      style={{ width: props.width ? props.width : "35vw" }}
    >
      {props.showHeader !== false && (
        <div className={style.header}>
          <div className={style.header_text}>
            צ'ק ליסט
            {props.userRole === "admin" && !props?.lock && (
              <Tooltip color="gray" title="הוספת מטלה">
                <Button
                  className={style.addRowBtn}
                  shape="circle"
                  size="small"
                  onClick={addItem}
                  disabled={props?.locked}
                >
                  <div style={{ marginBottom: "0.1vh" }}>+</div>
                </Button>
              </Tooltip>
            )}
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
        {sortedItems.map((item) => (
          <div
            key={item.id}
            className={style.rowLine}
            onClick={() =>
              props.userRole === "admin" &&
              !props.lock &&
              !item?.isEditing &&
              toggleEdit(item.id)
            }
          >
            {!item?.isEditing ? (
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
                    textDecoration: item.checked ? "line-through" : "none",
                    fontSize: "1rem",
                    fontWeight: "500",
                  }}
                >
                  {/* {item.text} */}

                  {item.text.length > 50 ? (
                    <Tooltip title={item.text}>
                      <span>{item.text.substring(0, 50)}...</span>
                    </Tooltip>
                  ) : (
                    <span>{item.text}</span>
                  )}
                </span>
                {props.userRole === "user" && (
                  <Tooltip
                    color="gray"
                    title={
                      props.isPreview
                        ? null
                        : props.checkLists?.find((i: any) => i.id === item.id)
                            ?.completed_at === null
                        ? " מטלה הושלמה"
                        : "מחק מטלה"
                    }
                  >
                    <div
                      className={style.updateMission}
                      onClick={() => {
                        const foundItem = props.todos?.find(
                          (i: any) => i.id == item.id
                        );
                        if (!foundItem || props.isPreview) return;

                        foundItem.completed_at === null
                          ? completedMission(foundItem) // ✓
                          : removeMission(foundItem); // ✓
                      }}
                    >
                      {props.checkLists?.find((i: any) => i.id === item.id)
                        ?.completed_at !== null && (
                        <div className={style.updateMissionCclicked}></div>
                      )}
                    </div>
                  </Tooltip>
                )}
              </div>
            ) : (
              <Input
                type="text"
                disabled={props?.locked}
                value={item.text}
                onChange={(e) => updateItemValue(item.id, e.target.value)}
                placeholder="כאן זה המקום להוסיף מטלה..."
                className={style.newRowInput}
                onKeyDown={(e) => e.key === "Enter" && saveItem(item.id)}
                onBlur={() => setTimeout(() => saveItem(item.id), 100)}
                autoFocus={!props?.locked ? true : false}
              />
            )}
            <div
              style={{
                display: props.userRole === "admin" ? "" : "none",
              }}
            >
              {props.userRole === "admin" && !props.lock ? (
                <Tooltip color="gray" title="מחיקת מטלה">
                  <Button
                    onClick={(e) => {
                      e.stopPropagation();
                      removeOption(item.id);
                    }}
                    disabled={props?.locked}
                    shape="circle"
                    size="small"
                    style={{ backgroundColor: "#ece5d6" }}
                  >
                    <div style={{ marginBottom: "0.3vh" }}>
                      {" "}
                      <CloseOutlined style={{ fontSize: "0.7rem" }} />
                    </div>
                  </Button>
                </Tooltip>
              ) : (
                props.userRole === "user" && (
                  <Tooltip
                    color="gray"
                    title={item.checked ? "סימון כ-טרם בוצע" : "סימון כבוצע"}
                  >
                    <div className={style.checkboxWrapper}>
                      <input
                        type="checkbox"
                        id={`checkbox-${item.id}`}
                        checked={item.checked}
                        onChange={() => toggleOption(item.id)}
                        className={style.checkboxInput}
                      />
                      <label
                        htmlFor={`checkbox-${item.id}`}
                        className={style.customCheckboxLabel}
                      >
                        {item.checked && (
                          <span className={style.innerCircle}></span>
                        )}
                      </label>
                    </div>
                  </Tooltip>
                )
              )}
            </div>
          </div>
        ))}
      </div>
      {props.userRole === "user" && (
        <div className={style["progress-container-fluid"]}>
          <div>
            {/* {items.length > 0
              ? `${Math.round(
                  (items.filter((item) => item.checked).length / items.length) *
                    100
                )}`
              : 0} */}
            {percentCompleted}%
          </div>
          <div className={style["progress-container"]}>
            <div
              className={style["progress-bar"]}
              style={{
                width: `${percentCompleted}%`,
              }}
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default CheckList;
