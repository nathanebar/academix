import React, { useEffect, useRef, useState } from "react";
import style from "../GradeStageCard/GradeStageCard.module.css";
import { useSelectionsStore } from "../../store/selectionStore";
import Task from "../Task/Task";
import { Button, Card, Empty } from "antd";
import { useFetchTagsByCourseId } from "../../hooks/useFetchTagsByCourseId";
import { Draggable } from "@fullcalendar/interaction";
import { useFetchTasksByTagId } from "../../hooks/useFetchTasksByTagId";
import { CompressOutlined, DeleteOutlined, ExpandOutlined } from "@ant-design/icons";
import { useRefreshStore } from "../../store/selectionStore";


interface TagGroupProps {
  activeHeaderType: string | null;
  filterOption: string;
  openModal?: boolean;
  isExpandedFather: boolean;
  setOpenModal?: any;
}

const TagGroup = (props: TagGroupProps) => {
  const { refreshKey } = useRefreshStore();
  const {
    selectedCourse,
    selectedCourseBatch,
    activeHeaderType,
    selectedTeam,
    selectedTeamMember,
  } = useSelectionsStore();
  const containerRef = useRef<HTMLDivElement>(null);
  const [expandedStates, setExpandedStates] = useState<Record<string, boolean>>(
    {}
  );
  const [tags, setTags] = useState<any[]>([]);
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
  const fetchedTags: any = useFetchTagsByCourseId(Number(selectedCourse?.id));

  useEffect(() => {
    if (tags?.length > 0) {
      setExpandedStates((prev) => {
        const newState: Record<string, boolean> = {};
        tags.forEach((gs: any) => {
          newState[gs.tagName] = props.isExpandedFather;
        });
        return newState;
      });
    }
  }, [tags, props.isExpandedFather]);

  useEffect(() => {
    if (
      fetchedTags?.data &&
      JSON.stringify(fetchedTags) !== JSON.stringify(tags)
    ) {
      setTags(fetchedTags?.data);
    }
  }, [JSON.stringify(fetchedTags?.data), selectedCourse?.id]);

  const {
    data: fetchedTasksByTag,
    isLoading,
    isError,
    refetch,
    ...rest
  } = useFetchTasksByTagId(
    fetchedTags?.data?.map((gs: any) => gs?.id),
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
    if (
      fetchedTasksByTag &&
      JSON.stringify(fetchedTasksByTag) !== JSON.stringify(tasks)
    ) {
      setTasks(fetchedTasksByTag);
    }
  }, [JSON.stringify(fetchedTasksByTag), JSON.stringify(fetchedTags?.data)]);
  const toggleExpand = (gsName: string) => {
    setExpandedStates((prev) => ({
      ...prev,
      [gsName]: !prev[gsName],
    }));
  };
  const start =
    new Date(selectedCourseBatch?.start_date) > new Date() ? false : true;

  if (fetchedTags?.length === 0) {
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
        <Empty description="אין שלבי הסמכה" />
      </div>
    );
  }

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
          isQueueTask: el.getAttribute("data-has-queue-task") || false
        };
      },
    });
    return () => draggable.destroy();
  }, [tasks?.length]);

  return (
    <div
      style={{ display: "flex", flexDirection: "row", gap: "10px" }}
      ref={containerRef}
    >
      {Object.entries(tasks)?.map(([tagName, tasks]) => {
        const isExpanded = expandedStates[tagName] ?? props.isExpandedFather;

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
                onClick={() => toggleExpand(tagName)}
                className={style["expand-button"]}
              />
              <div className={style["name"]}>{tagName}</div>
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
              onClick={() => toggleExpand(tagName)}
              style={{ display: !isExpanded ? "block" : "none" }}
            >
              <div className={style["axis-rotate-not-expansed"]}>
                <div
                  className={style["axis-title-not-expansed"]}
                  // style={{
                  //   background: `linear-gradient(to right, ${gradient.from}, ${gradient.to})`,
                  // }}
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

export default TagGroup;
