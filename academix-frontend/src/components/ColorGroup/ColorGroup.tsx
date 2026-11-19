import React, { useEffect, useRef, useState } from "react";
import style from "../GradeStageCard/GradeStageCard.module.css";
import { useSelectionsStore } from "../../store/selectionStore";
import Task from "../Task/Task";
import { Button, Card, Empty } from "antd";
import { Draggable } from "@fullcalendar/interaction";
import { useFetchTasksByColor } from "../../hooks/useFetchTasksByColor";
import { schemaMap } from "../../types/types";
import { useRefreshStore } from "../../store/selectionStore";
import {
  CompressOutlined,
  DeleteOutlined,
  ExpandOutlined,
} from "@ant-design/icons";

interface ColorGroupProps {
  activeHeaderType: string | null;
  filterOption: string;
  openModal?: boolean;
  setOpenModal?: any;
  isExpandedFather: boolean;
}

const ColorGroup = (props: ColorGroupProps) => {
  const { refreshKey } = useRefreshStore();
  const {
    selectedCourseBatch,
    activeHeaderType,
    selectedTeam,
    selectedTeamMember,
  } = useSelectionsStore();
  const containerRef = useRef<HTMLDivElement>(null);
  const [expandedStates, setExpandedStates] = useState<Record<string, boolean>>(
    {}
  );
  const [tasks, setTasks] = useState<any[]>([]);
  const getCategoryKey = (filterOption: string): string => {
    switch (filterOption) {
      case "assignment_bank":
        return "assignmentBank";
      case "operational":
        return "operational";
      case "archives":
        return "archives";
      default:
        return "operational";
    }
  };

  const {
    data: fetchedTasksByColor,
    isLoading,
    isError,
    refetch,
    ...rest
  } = useFetchTasksByColor(
    activeHeaderType != "domain" ? selectedTeam?.id ?? null : null,
    selectedTeamMember?.id ?? null,
    activeHeaderType === "teamMember",
    selectedCourseBatch.id
  );

   useEffect(() => {
    if (refreshKey > 0) {
      refetch();
    }
  }, [refreshKey]);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const draggable = new Draggable(el, {
      itemSelector: ".draggable-task",
      eventData: function (el) {
        return {
          title: el.getAttribute("data-title") || el.innerText,
          id: el.getAttribute("task-id"),
          endStr: el.getAttribute("data-duration") || "60",
        };
      },
    });
    return () => draggable.destroy();
  }, [tasks]);

  useEffect(() => {
    if (fetchedTasksByColor) {
      setTasks(fetchedTasksByColor);
    }
  }, [JSON.stringify(fetchedTasksByColor)]);

  useEffect(() => {
    if (fetchedTasksByColor) {
      setExpandedStates((prev) => {
        const newState: Record<string, boolean> = {};
        fetchedTasksByColor.forEach((task) => {
          newState[task?.color ?? "white"] = props.isExpandedFather;
        });
        return newState;
      });
    }
  }, [props.isExpandedFather]);

  const toggleExpand = (colorName: string) => {
    setExpandedStates((prev) => ({
      ...prev,
      [colorName]: !prev[colorName],
    }));
  };

  const start =
    new Date(selectedCourseBatch?.start_date) > new Date() ? false : true;

  if (tasks?.length === 0) {
    return (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <Empty description="אין משימות" />
      </div>
    );
  }

  return (
    <div
      style={{ display: "flex", flexDirection: "row", gap: "10px" }}
      ref={containerRef}
    >
      {Object.entries(tasks)?.map(([tagName, tasks]) => {
        const isExpanded =
          expandedStates[tasks.color] ?? props.isExpandedFather;

        const gradient =
          typeof tasks.color === "string"
            ? schemaMap[tasks.color]
            : { from: "white", to: "white" };

        const gradientStyle = `linear-gradient(135deg, ${gradient.from}, ${gradient.to})`;
        return (
          <>
            <div
              key={tagName}
              className={style["wrapper"]}
              style={{
                display: isExpanded ? "block" : "none",
                position: "relative",
              }}
            >
              <Button
                type="text"
                icon={isExpanded ? <CompressOutlined /> : <ExpandOutlined />}
                onClick={() => toggleExpand(tasks.color)}
                className={style["expand-button"]}
              />
              <div
                style={{ background: gradientStyle }}
                className={style["name"]}
              ></div>
              <div className={style["tasksWrapper"]}>
                {tasks[getCategoryKey(props.filterOption)]?.length > 0 ? (
                  tasks[getCategoryKey(props.filterOption)]?.map(
                    (task: any) => (
                      <div
                        style={{ marginBottom: "10px" }}
                        key={task?.id}
                        className="draggable-task"
                        data-title={task?.name}
                        data-duration={
                          task?.recommendedTime?.toString() ?? "60"
                        }
                        task-id={task?.id?.toString()}
                      >
                        <Task
                          start={start}
                          taskGroupName={task?.taskgroupname}
                          task={task}
                          activeHeaderType={props.activeHeaderType}
                          filterOption={props.filterOption}
                          key={task?.data?.id}
                          setOpenModal={() => {}}
                          setSelectedTask={() => {}}
                        />
                      </div>
                    )
                  )
                ) : (
                  <Empty description="אין משימות משוייכות" />
                )}
              </div>
            </div>
            <div
              className={style["axis-card-not-expansed"]}
              onClick={() => toggleExpand(tasks.color)}
              style={{ display: !isExpanded ? "block" : "none" }}
            >
              <div className={style["axis-rotate-not-expansed"]}>
                <div
                  className={style["axis-title-not-expansed"]}
                  style={{ background: gradientStyle }}
                >
                  <div style={{ width: "100px" }}>{tagName}</div>
                  <div>
                    ({tasks[getCategoryKey(props.filterOption)].length})
                  </div>
                </div>
              </div>
            </div>
          </>
        );
      })}
      <Card
        id="trash-zone"
        style={{
          display: "flex",
          cursor: "grab",
          position: "absolute",
          width: 50,
          height: 50,
          top: "93vh",
          right: 1530,
          alignItems: "center",
          justifyContent: "center",
          transition: "all 0.3s",
          border: "2px dashed #aaa",
          backgroundColor: "#fafafa",
        }}
      >
        <DeleteOutlined />
      </Card>
    </div>
  );
};

export default ColorGroup;
