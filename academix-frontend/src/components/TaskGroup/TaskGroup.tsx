import React, { useEffect, useMemo, useRef, useState } from "react";
import style from "./TaskGroup.module.css";
import { Task as TaskType } from "../../store/taskStore";
import {
  Dropdown,
  Popconfirm,
  Button,
  Tag,
  Tooltip,
  notification,
  Input,
} from "antd";
import {
  MoreOutlined,
  LockOutlined,
  TeamOutlined,
  EditOutlined,
  CheckOutlined,
  CloseOutlined,
  PlusOutlined,
} from "@ant-design/icons";
import NewTaskModal from "../NewTaskModal/NewTaskModal";
import { Gradient, schemaMap, SchemaName } from "../../types/types";
import Task from "../Task/Task";
import { useSelectionsStore } from "../../store/selectionStore";
import { Draggable } from "@fullcalendar/interaction";
import { useGroupTasks } from "../../hooks/useTasksByTaskGroupIdAndUser";
import api from "../../api/axios";
import { ItemType } from "antd/es/menu/interface";
import { useQueryClient } from "@tanstack/react-query";
import { useItemLockStatus } from "../../hooks/useItemLockStatus";
import { usePermissionStore } from "../../store/permissionStore";
import dayjs from "dayjs";
import stringCheckAndToolTip from "../../utils/stringCheck";
import { useSearchNavStore } from "../../store/searchNavStore";

type TaskGroupProps = {
  title?: string;
  tasks?: TaskType[] | any;
  id: number;
  canModify: boolean;
  scheme?: SchemaName | Gradient;
  filterOption: string;
  openModal?: any;
  setOpenModal?: any;
  isdayCalendar?: boolean;
  axisId?: number;
  taskGroupTeamId?: number | null;
  isLocked?: boolean;
  isCreatedByCurrentTeam?: boolean;
  filteredTaskId?: string | null;
  onClearFilter?: () => void;
  taskCount?: number;
  searchValue?: string;
  searchResults?: {
    operational: any[];
    assignment_bank: any[];
    archives: any[];
  };
  onTasksChanged?: any;
};

const TaskGroup = (props: TaskGroupProps) => {
  const gradient =
    typeof props.scheme === "string" ? schemaMap[props.scheme] : props.scheme;
  const styleProps: React.CSSProperties = {
    "--from": gradient?.from,
    "--to": gradient?.to,
  } as React.CSSProperties;
  const externalRef = useRef<HTMLUListElement>(null);
  const editInputRef = useRef<any>(null);
  let start: any;
  const {
    isLocked: checkIsLocked,
    isCreatedByCurrentTeam: checkIfCurrentTeam,
    isTeamCommander,
  } = useItemLockStatus();
  const { selectedPermission } = usePermissionStore();
  const isTeamCommanderPermission =
    selectedPermission?.role_code === "TEAM_COMMANDER";



    const { taskIds, currentIndex, currentTaskId } = useSearchNavStore();

  const {
    selectedTeam,
    selectedTeamMember,
    activeHeaderType,
    selectedCourseBatch,
    selectedCourse,
    selectedDate,
  } = useSelectionsStore();
  const [isCollapsed, setIsCollapsed] = useState(true);

  const {
    data: tasks,
    isLoading,
    isError,
    refetch,
    ...rest
  } = useGroupTasks(
     props.id,
    activeHeaderType != "domain" ? selectedTeam?.id ?? null : null,
    selectedTeamMember?.id ?? null,
    props.filterOption,
    activeHeaderType === "teamMember",
    selectedCourseBatch.id,
    selectedPermission?.role_code,
    undefined,
    isCollapsed

  );


  const getTeamId = (): number | null => {
    return props.taskGroupTeamId ?? null;
  };

  const [groupTasks, setGroupTasks] = useState(tasks || []);
  const [openModal, setOpenModal] = useState<boolean>(false);
  const queryClient = useQueryClient();
  const [selectedTask, setSelectedTask] = useState<any>(null);
  const [taskIsLocked, setTaskIsLocked] = useState<boolean>(false);
  const [isEditingName, setIsEditingName] = useState<boolean>(false);
  const [editedName, setEditedName] = useState<string>(props.title || "");
  const [isUpdatingName, setIsUpdatingName] = useState<boolean>(false);
  const [hasSearchTriggered, setHasSearchTriggered] = useState(false);


  useEffect(() => {
    const searchValue = props.searchValue?.trim();

    if (selectedPermission?.role_code === "STUDENT") {
      setIsCollapsed(false);
      return;
    }

    if (searchValue && searchValue.length > 0) {
      setIsCollapsed(false);
      setHasSearchTriggered(true);
    }
  
    else if (!searchValue || searchValue.length === 0) {
      setIsCollapsed(true);
      setHasSearchTriggered(false);
    }
  }, [props.searchValue]);
  const groupIsLocked =
    props.isLocked ??
    (() => {
      const tgTeamId = getTeamId();
      if (isTeamCommander || isTeamCommanderPermission) {
        if (tgTeamId === null) return true;
        if (tgTeamId !== selectedTeam?.id) return true;
      }
      return false;
    })();

  const groupCreatedByCurrentTeam =
    props.isCreatedByCurrentTeam ?? getTeamId() === selectedTeam?.id;


  const isSearchActive = Boolean(props.searchResults);


  const displayTasks = useMemo(() => {


    
    if (props.searchResults) {
      const key =
        props.filterOption === "assignment_bank"
          ? "assignment_bank"
          : props.filterOption;

      const allTasks =
        props.searchResults[key as keyof typeof props.searchResults] || [];

      // Filtrer pour CE task group seulement
      return allTasks.filter((task: any) => task.taskGroupId === props.id);
    }

    return groupTasks;
  }, [props.searchResults, groupTasks, props.filterOption, props.id]);



  useEffect(() => {
  if (!isSearchActive) return;
  if (displayTasks.some((t: any) => t.id === currentTaskId)) {
    setIsCollapsed(false);
  }
}, [isSearchActive, displayTasks, currentTaskId]);

  
  useEffect(() => {
 
    if (isSearchActive) {
   
      setIsCollapsed(displayTasks.length === 0);
    }
 
  }, [isSearchActive, displayTasks.length]);


  useEffect(() => {
    setEditedName(props.title || "");
  }, [props.title]);

  useEffect(() => {
    if (isEditingName && editInputRef.current) {
      setTimeout(() => {
        editInputRef.current?.focus();
        editInputRef.current?.select();
      }, 100);
    }
  }, [isEditingName]);

  useEffect(() => {
    setTaskIsLocked(isTaskLocked(selectedTask));
  }, [selectedTask]);

  useEffect(() => {
    const el = externalRef.current;
    if (!el) return;
    /*  if (selectedDate && selectedDate.isBefore(dayjs().startOf('day'))) {
      return;
    } */
    const draggable = new Draggable(el, {
      itemSelector: ".draggable-task",
      eventData: function (el) {
        return {
          title: el.getAttribute("data-title") || el.innerText,
          id: el.getAttribute("task-id"),
          endStr: el.getAttribute("data-duration") || "60",
          isQueueTask: el.getAttribute("data-has-queue-task") || false,
        };
      },
    });
    return () => draggable.destroy();
  }, [selectedDate]);
  useEffect(() => {
    if (isLoading) {
      return;
    }
    if (isError) {
      setGroupTasks([]);
      return;
    }
    if (tasks) {
      const filteredTasks =
        tasks[
          props.filterOption === "assignment_bank"
            ? "assignmentBank"
            : props.filterOption
        ] || [];

      setGroupTasks(filteredTasks);
    } else {
      setGroupTasks([]);
    }
  }, [tasks, props.filterOption]);

  const hasMatchingTask = (): boolean => {
    if (!props.filteredTaskId) return true;
    return groupTasks.some(
      (task: any) => task.id?.toString() === props.filteredTaskId
    );
  };

  const shouldShowTaskGroup = hasMatchingTask();
  const toggleCollapse = () => {
    setIsCollapsed(!isCollapsed);
  };
  const handleUpdateTaskGroupName = async () => {
    if (!editedName.trim()) {
      notification.warning({
        message: "שגיאה",
        description: "שם קבוצת המשימות לא יכול להיות ריק",
        duration: 3,
        placement: "topRight",
        style: { direction: "rtl" },
      });
      return;
    }
    if (editedName.trim() === props.title) {
      setIsEditingName(false);
      return;
    }
    if (groupIsLocked) {
      notification.warning({
        message: "לא ניתן לערוך קבוצה זו",
        description: "קבוצה זו נוצרה בהיררכיה גבוה",
        duration: 4,
        placement: "topRight",
        style: { direction: "rtl" },
      });
      return;
    }
    setIsUpdatingName(true);
    try {
      const response = await api.put(`/taskGroup/${props.id}`, {
        name: editedName.trim(),
        batchId: selectedCourseBatch.id,
      });
      queryClient.invalidateQueries({
        queryKey: ["AxisBatch"],
      });
      queryClient.invalidateQueries({
        queryKey: ["taskGroups"],
      });
      queryClient.invalidateQueries({
        queryKey: ["group-tasks"],
      });
      notification.success({
        message: "הצלחה",
        description: "שם קבוצת המשימות עודכן בהצלחה",
        duration: 3,
        placement: "topRight",
        style: { direction: "rtl" },
      });
      setIsEditingName(false);
    } catch (error) {
      console.error("Error updating task group name:", error);
      notification.error({
        message: "שגיאה",
        description: "לא ניתן לעדכן את שם קבוצת המשימות",
        duration: 4,
        placement: "topRight",
        style: { direction: "rtl" },
      });
    } finally {
      setIsUpdatingName(false);
    }
  };

  const handleCancelEdit = () => {
    setEditedName(props.title || "");
    setIsEditingName(false);
  };

  const handleDeleteTaskGroup = async () => {
    if (groupIsLocked) {
      notification.warning({
        message: "לא ניתן למחוק קבוצה זו",
        description: "קבוצה זו נוצרה בהיררכיה גבוה",
        duration: 4,
        placement: "topRight",
        style: { direction: "rtl" },
      });
      return;
    }
    try {
      await api.delete(`/taskGroup/${props.id}`, {
        data: {
          batchId: selectedCourseBatch.id,
        },
      });
      queryClient.invalidateQueries({
        queryKey: ["AxisBatch"],
      });
      queryClient.invalidateQueries({
        queryKey: ["taskGroups"],
      });
      queryClient.invalidateQueries({
        queryKey: ["group-tasks"],
      });
    } catch (error) {
      console.error("Error deleting task group:", error);
    }
  };

  const handleTaskGroupToArchive = async (
    type: "assignment_bank" | "archives" | "operational"
  ) => {
    if (groupIsLocked) {
      notification.warning({
        message: "לא ניתן להעביר קבוצה זו",
        description: "קבוצה זו נוצרה בהיררכיה גבוה",
        duration: 4,
        placement: "topRight",
        style: { direction: "rtl" },
      });
      return;
    }
    try {
      const confirmUpdate = window.confirm(
        "האם אתה בטוח שברצונך להעביר את כל המשימות תחת קבוצת המשימות הזו לארכיון? \nפעולה זו לא ניתנת לביטול."
      );
      if (!confirmUpdate) {
        return;
      }
      const response = await api.put(`/taskGroup/${props.id}`, {
        status: type,
        batchId: selectedCourseBatch.id,
      });
      queryClient.invalidateQueries({
        queryKey: ["AxisBatch"],
      });
      queryClient.invalidateQueries({
        queryKey: ["taskGroups"],
      });
      queryClient.invalidateQueries({
        queryKey: ["group-tasks"],
      });
    } catch (error) {
      console.error("Error updating task group:", error);
    }
  };

  const baseItems: Record<string, Omit<ItemType, "key">> = {
    edit: {
      label: "עריכת שם",
      style: { borderBottom: "1px solid #f0f0f0" },
      onClick: () => {
        setEditedName(props.title || "");
        setIsEditingName(true);
      },
      disabled: groupIsLocked,
    },
    archive: {
      label: "העברה לארכיון",
      style: { borderBottom: "1px solid #f0f0f0" },
      onClick: () => handleTaskGroupToArchive("archives"),
      disabled: groupIsLocked,
    },
    operational: {
      label: "העברה למאגר משימות",
      style: { borderBottom: "1px solid #f0f0f0" },
      onClick: () => handleTaskGroupToArchive("operational"),
      disabled: groupIsLocked,
    },
    bank: {
      label: "העברה לבנק מטלות",
      style: { borderBottom: "1px solid #f0f0f0" },
      onClick: () => handleTaskGroupToArchive("assignment_bank"),
      disabled: groupIsLocked,
    },
    delete: {
      label: (
        <Popconfirm
          title="האם אתה בטוח שברצונך למחוק את קבוצת המשימות?"
          description="פעולה זו לא ניתנת לביטול"
          onConfirm={() => handleDeleteTaskGroup()}
          okText="כן, מחק"
          cancelText="ביטול"
          placement="bottom"
        >
          <div style={{ color: "red" }}>מחיקה</div>
        </Popconfirm>
      ),
      style: { borderBottom: "1px solid #f0f0f0" },
      disabled: groupIsLocked,
    },
    add: {
      label: "הוספת תרגיל",
      style: { borderBottom: "1px solid #f0f0f0" },
      onClick: () => setOpenModal(true),
      disabled: props.filterOption !== "operational",
    },
  };

  const getItemsForFilter = (filterOption: string): ItemType[] => {
    const baseItems: Record<string, Omit<ItemType, "key">> = {
      edit: {
        label: "עריכת שם",
        style: { borderBottom: "1px solid #f0f0f0" },
        onClick: () => {
          setEditedName(props.title || "");
          setIsEditingName(true);
        },
        disabled: !props.canModify,
      },
      archive: {
        label: "העברה לארכיון",
        style: { borderBottom: "1px solid #f0f0f0" },
        onClick: () => handleTaskGroupToArchive("archives"),
        disabled: !props.canModify,
      },
      operational: {
        label: "העברה למאגר משימות",
        style: { borderBottom: "1px solid #f0f0f0" },
        onClick: () => handleTaskGroupToArchive("operational"),
        disabled: !props.canModify,
      },
      bank: {
        label: "העברה לאופליין",
        style: { borderBottom: "1px solid #f0f0f0" },
        onClick: () => handleTaskGroupToArchive("assignment_bank"),
        disabled: !props.canModify,
      },
      delete: {
        label: (
          <Popconfirm
            title="האם אתה בטוח שברצונך למחוק את קבוצת המשימות?"
            description="פעולה זו לא ניתנת לביטול"
            onConfirm={() => handleDeleteTaskGroup()}
            okText="כן, מחק"
            cancelText="ביטול"
            placement="bottom"
          >
            <div style={{ color: "red" }}>מחיקה</div>
          </Popconfirm>
        ),
        style: { borderBottom: "1px solid #f0f0f0" },
        disabled: !props.canModify,
      },
      add: {
        label: "הוספת תרגיל",
        style: { borderBottom: "1px solid #f0f0f0" },
        onClick: () => setOpenModal(true),
      },
    };
    const itemMap: Record<string, string[]> = {
      archives: ["edit", "operational", "bank", "delete", "add"],
      operational: ["edit", "add", "archive", "bank", "delete"],
      assignment_bank: ["edit", "archive", "operational", "delete", "add"],
    };
    const keys = itemMap[filterOption] || [];
    return keys.map((key) => ({
      key,
      ...baseItems[key],
    }));
  };

  const items: ItemType[] | undefined = getItemsForFilter(props.filterOption);
  const lockedGroupItems: ItemType[] = [
    {
      key: "add",
      ...baseItems["add"],
      label: "הוספת תרגיל",
    },
  ];

  start = new Date(selectedCourseBatch.start_date) > new Date() ? false : true;

  const isTaskLocked = (task: any): boolean => {
    const taskTeamId = task?.team_id ?? task?.teamId ?? null;
    if (taskTeamId === null && checkIfCurrentTeam(null)) {
      return true;
    }
    return false;
  };

  const renderOriginIndicator = () => {
    if (groupIsLocked) {
      return (
        <Tooltip title="קבוצה שנוצרה בהיררכיה גבוה - ניתן רק להוסיף משימות">
          <Tag
            icon={<LockOutlined />}
            color="default"
            style={{
              background: "rgba(255, 255, 255, 1)",
              border: "none",
              cursor: "default",
            }}
          ></Tag>
        </Tooltip>
      );
    }
    if (groupCreatedByCurrentTeam) {
      return (
        <Tooltip title="קבוצה שנוצרה על ידי המפקד צוות">
          <Tag
            icon={<TeamOutlined />}
            color="default"
            style={{
              background: "rgba(255, 255, 255, 1)",
              border: "none",
              cursor: "default",
            }}
          ></Tag>
        </Tooltip>
      );
    }
    return null;
  };

  if (props.filteredTaskId && !shouldShowTaskGroup) {
    return null;
  }
  return (
    <div className={style[selectedPermission?.role_code != "STUDENT" ? "task-group" : "task-group-student"]} style={styleProps}>
      {
 selectedPermission?.role_code != "STUDENT" &&
      <div className={style["task-header"]}>
        {
          <div
            style={{ display: "flex", alignItems: "center", gap: 8, flex: 1 }}
          >
            {isEditingName ? (
              <div className={style["edit-name-container"]}>
                <Input
                  ref={editInputRef}
                  value={editedName}
                  onChange={(e) => setEditedName(e.target.value)}
                  className={style["edit-name-input"]}
                  placeholder="הזן שם חדש"
                  maxLength={100}
                  onPressEnter={handleUpdateTaskGroupName}
                  onKeyDown={(e) => {
                    if (e.key === "Escape") {
                      handleCancelEdit();
                    }
                  }}
                  suffix={
                    <div
                      style={{ display: "flex", gap: 4, alignItems: "center" }}
                    >
                      <CheckOutlined
                        onClick={
                          isUpdatingName ? undefined : handleUpdateTaskGroupName
                        }
                        className={style["icon-save"]}
                      />
                      <CloseOutlined
                        onClick={handleCancelEdit}
                        className={style["icon-cancel"]}
                      />
                    </div>
                  }
                />
              </div>
            ) : (
              1 && (
                <>
                  <span
                    className={style["task-group-title"]}
                    onClick={toggleCollapse}
                  >
                    {
                    stringCheckAndToolTip(props.title,15)
                    } 
                  
                  </span>

                   <>
                      <span>({props.taskCount ?? 0})</span>
                      {renderOriginIndicator()}
                    </>
                </>
              )
            )}
          </div>
        }
        <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
          {
            activeHeaderType !==
              "teamMember" && (
              <Tooltip title="הוספת תרגיל">
                <PlusOutlined
                  style={{
                    fontSize: 15,
                    cursor: "pointer",
                    color: "#333",
                  }}
                  onClick={() => setOpenModal(true)}
                />
              </Tooltip>
            )
          }
          {
            ((selectedPermission?.role_code !== "OVERLAP" &&
              selectedPermission?.role_code !== "TEAM_COMMANDER") ||
              groupCreatedByCurrentTeam) &&
              activeHeaderType !== "teamMember" && (
                <Dropdown
                  menu={{
                    items: groupIsLocked ? lockedGroupItems : items,
                  }}
                  trigger={["click"]}
                >
                  <div style={{ cursor: "pointer" }}>
                    <MoreOutlined
                      style={{ opacity: groupIsLocked ? 0.7 : 1 }}
                    />
                  </div>
                </Dropdown>
              )
          }
        </div>
      </div>
      }

      <ul
        className={style["tasks-list"]}
        ref={externalRef}
        // onClick={toggleCollapse}
        style={{
          overflow: "hidden",
          transition:
            "max-height 0.3s ease-in-out, opacity 0.3s ease-in-out, padding 0.3s ease-in-out",
          maxHeight: isCollapsed ? "0" : "none",
          opacity: isCollapsed ? 0 : 1,
          // padding: isCollapsed ? "0 24px" : "0 24px 16px 24px",
        }}
      >
        {Array.isArray(displayTasks)
          ? displayTasks
              ?.filter((task: any) => {
                if (props.filteredTaskId) {
                  return task.id?.toString() === props.filteredTaskId;
                }
                if (
                  activeHeaderType === "course" ||
                  activeHeaderType === "courseBatches" ||
                  activeHeaderType === "domain"
                ) {
                  return task.team_id === null;
                } else
                  return (
                    task.team_id === null || task.team_id === selectedTeam?.id
                  );
              })
              // .filter((task) => {
              //   const search = props.searchValue?.trim()?.toLowerCase();
              //   return !search || task.name.toLowerCase().includes(search);
              // })
              .map((task: any) => {
                const taskIsLocked = isTaskLocked(task);
          const isNavFocused =
  currentTaskId != null &&
  String(currentTaskId) === String(task?.id);
           

                return (
                  
                 <div
      key={task?.id}
      data-nav-task-id={task?.id} 
      ref={(node) => {
        // כשזו המשימה המסומנת - גוללים אליה (ref!)
        if (node && isNavFocused) {
          node.scrollIntoView({ behavior: "smooth", block: "center" });
        }
      }}
      className={isNavFocused ? style["task-nav-focused"] : undefined}
      style={{ borderRadius: 10, transition: "box-shadow 0.2s ease" }}
    >
      <Task
        start={start}
        taskGroupName={props.title}
        task={task}
        activeHeaderType={activeHeaderType}
        filterOption={props.filterOption}
        setOpenModal={setOpenModal}
        setSelectedTask={setSelectedTask}
        isdayCalendar={props.isdayCalendar}
        taskTeamId={task.team_id}
        isLocked={taskIsLocked}
        canModify={!taskIsLocked && props.canModify}
        filteredTaskId={props.filteredTaskId}
        onClearFilter={props.onClearFilter}
        onTasksChanged={props.onTasksChanged}
        taskGroupColor={props.scheme}
      />
    </div>
                );
              })
          : null}
        {props?.taskCount === 0 && !props.filteredTaskId && (
          <span>לא נוספו משימות עדיין </span>
        )}
      </ul>

      {!taskIsLocked && openModal && (
        <NewTaskModal
          openModal={openModal}
          setOpenModal={setOpenModal}
          taskGroup={groupTasks}
          editingTask={selectedTask}
          taskGroupId={props.id}
          axisId={props.axisId}
          locked={selectedTask && selectedTask.assignedcount > 0}
          setSelectedTask={setSelectedTask}
          AxisColor={String(props?.scheme)}
          filterOption={props.filterOption}
          onTasksChanged={props.onTasksChanged}
        />
      )}
    </div>
  );
};

export default TaskGroup;
