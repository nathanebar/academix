import React, { useEffect, useState, useMemo, useRef } from "react";
import style from "./AxisCard.module.css";
import TaskGroup from "../../TaskGroup/TaskGroup";
import { Axis, schemaMap, TaskGroupData } from "../../../types/types";
import StatPill from "../../../UI/StatPill/StatPill";
import { useTaskGroupsByAxisId } from "../../../hooks/useTaskGroupsByAxisId";
import BlackButton from "../../../UI/Button/BlackButton";
import { Button, Input, notification } from "antd";
import {
  CloseCircleOutlined,
  CompressOutlined,
  ExpandOutlined,
} from "@ant-design/icons";
import { usePermissionStore } from "../../../store/permissionStore";
import EditTemplateAxisModal from "../../Modals/EditTemplateAxis/EditTemplateAxisModal";
import {
  createTaskGroup,
  deleteAxis,
  updateAxis,
} from "../../../services/ApiServices";
import { useSelectionsStore } from "../../../store/selectionStore";
import { useQueryClient } from "@tanstack/react-query";
import { useItemLockStatus } from "../../../hooks/useItemLockStatus";
import { useCoursesData } from "../../../hooks/useHierarchyData";

type Props = {
  axis: Axis;
  filterOption: string;
  isExpandedFather: boolean;
  filteredTaskId?: string | null;
  onClearFilter?: () => void;
  searchValue?: string; // ← NOUVEAU
  searchResults?: {
    // ← NOUVEAU
    operational: any[];
    assignment_bank: any[];
    archives: any[];
  };
};

const AxisCard = ({
  axis,
  filterOption,
  isExpandedFather,
  filteredTaskId,
  onClearFilter,
  searchValue, // ← NOUVEAU
  searchResults, // ← NOUVEAU
}: Props) => {
  let start;
  const [isExpanded, setIsExpanded] = useState<boolean>(isExpandedFather);
  const { isLocked, isTeamCommander } = useItemLockStatus();
  const axisIsLocked = isLocked(axis.team_id);
  const { selectedCourseBatch, activeHeaderType, selectedTeam } =
    useSelectionsStore();
  const { selectedPermission, setSelectedPermission } = usePermissionStore();
  const queryClient = useQueryClient();
  const inputRef = useRef<any>(null);

  const isStudent = selectedPermission?.role_code === "STUDENT";
  // const isSearchActive = searchValue && searchValue.length >= 2;
  const isSearchActive = Boolean(searchResults);

  const {
    data: AxisTaskGroups,
    isLoading,
    isError,
    error,
    refetch,
    queryKey,
  } = useTaskGroupsByAxisId([axis?.id], selectedCourseBatch?.id, filterOption);
  const invalidateTaskGroupQuery = () => {
    queryClient.invalidateQueries({
      queryKey: queryKey, // ← INVALIDATION CIBLÉE: uniquement ce taskGroup
    });
  };
  const getTaskGroupTeamId = (taskGroup: any): number | null => {
    return taskGroup.team_id ?? taskGroup.teamId ?? taskGroup.TeamId ?? null;
  };
  const filteredTaskGroups = useMemo(() => {
    if (!AxisTaskGroups) return [];

    const operational = AxisTaskGroups?.operational || [];
    const assignment_bank = AxisTaskGroups?.assignment_bank || [];
    const archives = AxisTaskGroups?.archives || [];

    // Build set of taskGroupIds with search results (if search is active)
    const tgIdsWithResults: Set<number> = new Set();

    if (isSearchActive && searchResults) {
      Object.values(searchResults).forEach((tasks: any[]) => {
        if (Array.isArray(tasks)) {
          tasks.forEach((task: any) => {
            if (task.taskGroupId) {
              tgIdsWithResults.add(task.taskGroupId);
            }
          });
        }
      });
    }



    
    // Helper to filter by search results
    const matchesSearch = (tg: any) =>
      !isSearchActive || !searchResults || tgIdsWithResults.has(tg.id);

    switch (filterOption) {
      case "operational":
        return operational.filter(matchesSearch);

      case "assignment_bank": {
        const operationalIds = new Set(operational.map((tg: any) => tg.id));
        return [
          ...assignment_bank,
          ...operational.filter((tg: any) => !operationalIds.has(tg.id)),
        ].filter(matchesSearch);
      }

      case "archives": {
        const seenIds = new Set<number>();
        return [...archives].filter(matchesSearch).filter((tg) => {
          if (seenIds.has(tg.id)) return false;
          seenIds.add(tg.id);
          return true;
        });
      }

      default:
        return [];
    }
  }, [AxisTaskGroups, filterOption, isSearchActive, searchResults]);

  const courses = useCoursesData();
  const [onAddTaskGroup, setOnAddTaskGroup] = useState<boolean>(false);
  const [taskGroupName, setTaskGroupName] = useState<string>("");

  useEffect(() => {
    if (onAddTaskGroup && inputRef.current) {
      setTimeout(() => {
        inputRef.current?.focus();
      }, 50);
    }
  }, [onAddTaskGroup]);

  const [isOpenTemplatesModal, setIsOpenTemplatesModal] =
    useState<boolean>(false);

  const handleEditTemplate = async () => {
    setIsOpenTemplatesModal(true);
  };

  const isTaskGroupLocked = (taskGroup: any): boolean => {
    const tgTeamId = getTaskGroupTeamId(taskGroup);
    if (isTeamCommander && tgTeamId === null) {
      return true;
    }
    if (isTeamCommander && tgTeamId !== null && tgTeamId !== selectedTeam?.id) {
      return true;
    }
    return false;
  };

  const isTaskGroupByCurrentTeam = (taskGroup: any): boolean => {
    const tgTeamId = getTaskGroupTeamId(taskGroup);
    return tgTeamId === selectedTeam?.id;
  };

  const handleAddTaskGroup = async () => {
    if (taskGroupName.trim().length === 0) {
      notification.error({
        message: "יש להקליד קבוצת משימות",
        duration: 4,
        placement: "topRight",
        style: { direction: "rtl" },
      });
      return;
    }
    if (taskGroupName.trim()) {
      try {
        if (
          selectedPermission?.scope_type !== "system" &&
          !selectedPermission?.scope_id
        ) {
          console.error("Course ID is required");
          return;
        }
        const TaskGroupData: TaskGroupData = {
          axisId: axis.id,
          name: taskGroupName.trim(),
          team_id:
            activeHeaderType === "team" ? selectedTeam?.id ?? null : null,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        };
        await createTaskGroup(TaskGroupData, selectedCourseBatch.id, axis.id);
        setTaskGroupName("");
        setOnAddTaskGroup(false);
        refetch();
      } catch (error) {
        console.error("Failed to create axis:", error);
      }
    }
  };

  useEffect(() => {
    setIsExpanded(isExpandedFather);
  }, [isExpandedFather]);

  const handleDeleteAxis = async (id: number | undefined) => {
    if (!id) {
      console.error("Invalid axis ID");
      return;
    }
    if (axisIsLocked) {
      notification.warning({
        message: "לא ניתן למחוק ציר זה",
        description: "ציר זה נוצר בהיררכיה גבוה ואין באפשרותך למחוק אותו",
        duration: 4,
        placement: "topRight",
        style: { direction: "rtl" },
      });
      return;
    }
    try {
      const response = await deleteAxis(id);
      if (response.status === 200) {
        notification.success({
          message: "הציר נמחק בהצלחה",
          duration: 3,
          placement: "topRight",
          style: { direction: "rtl" },
        });
        if (selectedPermission) {
          const updatedAllowedAxisIds =
            selectedPermission?.allowedAxisIds?.filter(
              (axisId: number) => axisId !== id
            );
          setSelectedPermission({
            ...selectedPermission,
            allowedAxisIds: updatedAllowedAxisIds,
          });
        }
        queryClient.invalidateQueries({
          queryKey: ["AxisBatch"],
        });
      } else {
        notification.error({
          message: "שגיאה במחיקת הציר",
          description: response.data?.message || "לא ניתן למחוק את הציר",
          duration: 3,
          placement: "topRight",
          style: { direction: "rtl" },
        });
      }
    } catch (error) {
      console.error("Failed to delete axis:", error);
      notification.error({
        message: "שגיאה במחיקת הציר",
        description: "לא ניתן למחוק את הציר",
        duration: 3,
        placement: "topRight",
        style: { direction: "rtl" },
      });
    }
  };

  const handleArchivedAxis = async (id: number, newStatus: string) => {
    if (axisIsLocked) {
      notification.warning({
        message: "לא ניתן להעביר ציר זה",
        description: "ציר זה נוצר בהיררכיה גבוה ואין באפשרותך להעביר אותו",
        duration: 4,
        placement: "topRight",
        style: { direction: "rtl" },
      });
      return;
    }
    try {
      await updateAxis(id, {
        repository_kind: newStatus,
        batch_id: selectedCourseBatch.id,
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
    } catch (err) {
      console.log(err);
    }
  };

  if (isLoading) {
    return (
      <div className={style["axis-card"]}>
        <div className={style["loading"]}>טוען...</div>
      </div>
    );
  }

  if (isError) {
    return (
      <div className={style["axis-card"]}>
        <div className={style["error"]}>שגיאה: {error.message}</div>
      </div>
    );
  }

  start = new Date(selectedCourseBatch?.start_date) > new Date() ? false : true;

  const gradient =
    typeof axis.color === "string" ? schemaMap[axis.color] : axis.color;

  return (
    <>
      <div
        className={style["axis-card"]}
        style={{
          display: isExpanded ? "flex" : "none", // שנה מ-block ל-flex
          position: "relative",
          flexDirection: "column", // הוסף
        }}
      >
        {/* עטיפת הכותרת ב-div נפרד למניעת בעיות גלילה */}
        <div className={style["axis-card-header-wrapper"]}>
          <Button
            type="text"
            icon={isExpanded ? <CompressOutlined /> : <ExpandOutlined />}
            onClick={() => setIsExpanded(!isExpanded)}
            className={style["expand-button"]}
          />
          <div className={style["axis-card-header"]}>
            <StatPill
              axisId={axis.id ?? -1}
              label={axis.name}
              count={filteredTaskGroups?.length || 0}
              scheme={axis.color}
              canModify={axis.repository_kind === filterOption}
              start={start}
              filterOption={filterOption}
              handleDeleteAxis={handleDeleteAxis}
              handleArchivedAxis={handleArchivedAxis}
              handleEditTemplate={handleEditTemplate}
              teamId={axis.team_id}
              isLocked={axisIsLocked}
            />
            {isOpenTemplatesModal && (
              <EditTemplateAxisModal
                courseName={
                  courses.find((course) => course.id === axis.courseId)?.name
                }
                axisId={axis.id}
                open={isOpenTemplatesModal}
                setOpen={setIsOpenTemplatesModal}
              />
            )}
          </div>
        </div>

        {/* קונטיינר גלילה - רק התוכן גולל */}
        <div className={style["scrollable-wrapper"]}>
          <div className={style["task-groups-container"]}>
            {filteredTaskGroups?.length === 0 && !onAddTaskGroup && (
              <div
                style={{
                  display: "flex",
                  justifyContent: "center",
                  color: filterOption === "assignment_bank" ? "white" : "black",
                }}
              >
                <span>אין קבוצות קיימות</span>
              </div>
            )}
            {filteredTaskGroups
              ?.filter((taskGroup: any) => {
                if (
                  activeHeaderType === "course" ||
                  activeHeaderType === "courseBatches" ||
                  activeHeaderType === "domain"
                ) {
                  return taskGroup.team_id === null;
                } else
                  return (
                    taskGroup.team_id === null ||
                    taskGroup.team_id === selectedTeam?.id
                  );
              })
              .map((taskGroup: any, index: number) => {
                const tgIsLocked = isTaskGroupLocked(taskGroup);
                const tgIsByCurrentTeam = isTaskGroupByCurrentTeam(taskGroup);
                if (isStudent && taskGroup.task_count === 0) {
                  return <></>;
                }
                return (
                  <div
                    key={`${taskGroup.id}-${selectedCourseBatch.id}`}
                    // className={style["task-group-wrapper"]}
                  >
                    <TaskGroup
                      axisId={axis.id ?? -1}
                      scheme={axis.color}
                      title={taskGroup.name}
                      id={taskGroup.id}
                      canModify={
                        taskGroup.status === filterOption && !tgIsLocked
                      }
                      filterOption={filterOption}
                      taskGroupTeamId={taskGroup.team_id}
                      isLocked={tgIsLocked}
                      isCreatedByCurrentTeam={tgIsByCurrentTeam}
                      filteredTaskId={filteredTaskId}
                      onClearFilter={onClearFilter}
                      taskCount={taskGroup.task_count}
                      // searchValue={searchValue} // ← NOUVEAU
                      searchResults={isSearchActive ? searchResults : undefined}
                      onTasksChanged={invalidateTaskGroupQuery}
                    />
                  </div>
                );
              })}
          </div>

          {activeHeaderType !== "teamMember" &&
            filterOption === "operational" && (
              <div className={style["add-button-container"]}>
                {onAddTaskGroup ? (
                  <div className={style["add-container"]}>
                    <div style={{ display: "flex", gap: 10 }}>
                      <Input
                        ref={inputRef}
                        onKeyDown={(e: any) => {
                          if (e.key === "Enter") {
                            handleAddTaskGroup();
                          }
                        }}
                        value={taskGroupName}
                        type="search"
                        className={style["search-input"]}
                        onChange={(e) => {
                          setTaskGroupName(e.target.value);
                        }}
                        height="5.5vh"
                        width="14vw"
                        placeholder="הקלד שם לקבוצת משימות"
                      />
                      <CloseCircleOutlined
                        onClick={() => setOnAddTaskGroup(false)}
                      />
                    </div>
                    <div className={style["add-button-container"]}>
                      <Button
                        className={style.addButtonTaskGroup}
                        onClick={handleAddTaskGroup}
                      >
                        <span style={{ fontSize: 14 }}>הוספה +</span>
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div
                    className={style["add-axis-content"]}
                    onClick={() => setOnAddTaskGroup(true)}
                  >
                    <BlackButton width={"80%"} height={"3.5vh"}>
                      <span style={{ fontSize: 14 }}>הוסף קבוצת משימות</span>
                    </BlackButton>
                  </div>
                )}
              </div>
            )}
        </div>
      </div>

      <div
        className={style["axis-card-not-expansed"]}
        onClick={() => setIsExpanded(!isExpanded)}
        style={{ display: !isExpanded ? "block" : "none" }}
      >
        <div className={style["axis-rotate-not-expansed"]}>
          <div
            className={style["axis-title-not-expansed"]}
            style={{
              background: `linear-gradient(to right, ${gradient.from}, ${gradient.to})`,
            }}
          >
            <div style={{ width: "100px" }}>{axis.name}</div>
            <div>
              (
              {
                filteredTaskGroups?.filter((taskGroup: any) => {
                  if (
                    activeHeaderType === "course" ||
                    activeHeaderType === "courseBatches" ||
                    activeHeaderType === "domain"
                  ) {
                    return taskGroup.team_id === null;
                  } else
                    return (
                      taskGroup.team_id === null ||
                      taskGroup.team_id === selectedTeam?.id
                    );
                }).length
              }
              )
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default AxisCard;
