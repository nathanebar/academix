import React, { useEffect, useRef, useState } from "react";
import style from "./GradeStageCard.module.css";
import { useSelectionsStore } from "../../store/selectionStore";
import { useFetchGradeStagesByCourseId } from "../../hooks/useFetchGradeStagesByCourseId";
import { useFetchTasksByGradeStageId } from "../../hooks/useFetchTasksByGradeStageId";
import Task from "../Task/Task";
import { NewTaskModal } from "../LazyTaskModals";
import { Button, Card, Empty } from "antd";
import { Draggable } from "@fullcalendar/interaction";
import { useRefreshStore } from "../../store/selectionStore";

import {
  CompressOutlined,
  DeleteOutlined,
  ExpandOutlined,
} from "@ant-design/icons";

interface GradeStageCardProps {
  activeHeaderType: string | null;
  filterOption: string;
  openModal?: boolean;
  setOpenModal?: any;
  isExpandedFather: boolean;
}

const GradeStageCard = (props: GradeStageCardProps) => {
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
  const [gradeStages, setGradeStages] = useState<any[]>([]);
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
  const fetchedGradeStages: any = useFetchGradeStagesByCourseId(
    Number(selectedCourse?.id)
  );
  useEffect(() => {
    if (refreshKey > 0 && fetchedTasksByGradeStage.refetch) {
      fetchedTasksByGradeStage.refetch();
    }
  }, [refreshKey]);

  useEffect(() => {
    if (
      fetchedGradeStages?.data &&
      JSON.stringify(fetchedGradeStages) !== JSON.stringify(gradeStages)
    ) {
      setGradeStages(fetchedGradeStages?.data);
    }
  }, [JSON.stringify(fetchedGradeStages?.data), selectedCourse?.id]);

  const fetchedTasksByGradeStage = useFetchTasksByGradeStageId(
    fetchedGradeStages?.data?.map((gs: any) => gs?.id),
    activeHeaderType != "domain" ? selectedTeam?.id ?? null : null,
    selectedTeamMember?.id ?? null,
    activeHeaderType === "teamMember",
    selectedCourseBatch.id
  );
  useEffect(() => {
    if (gradeStages?.length > 0) {
      setExpandedStates((prev) => {
        const newState: Record<string, boolean> = {};
        gradeStages.forEach((gs: any) => {
          newState[gs.name] = props.isExpandedFather;
        });
        return newState;
      });
    }
  }, [gradeStages, props.isExpandedFather]);
  useEffect(() => {
    if (
      fetchedTasksByGradeStage?.data &&
      JSON.stringify(fetchedTasksByGradeStage) !== JSON.stringify(tasks)
    ) {
      setTasks(fetchedTasksByGradeStage?.data);
    }
  }, [
    JSON.stringify(fetchedTasksByGradeStage?.data),
    JSON.stringify(fetchedGradeStages?.data),
  ]);
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
  }, [tasks?.length]);

  const toggleExpand = (gsName: string) => {
    setExpandedStates((prev) => ({
      ...prev,
      [gsName]: !prev[gsName],
    }));
  };

  const start =
    new Date(selectedCourseBatch?.start_date) > new Date() ? false : true;

  if (gradeStages?.length === 0) {
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

  return (
    <div
      style={{ display: "flex", flexDirection: "row", gap: "10px" }}
      ref={containerRef}
    >
      {Object.entries(tasks)?.map(([gsName, tasks]) => {
        const isExpanded = expandedStates[gsName] ?? props.isExpandedFather;

        return (
          <>
            <div
              key={gsName}
              className={style["wrapper"]}
              style={{
                display: isExpanded ? "block" : "none",
                position: "relative",
              }}
            >
              <Button
                type="text"
                icon={isExpanded ? <CompressOutlined /> : <ExpandOutlined />}
                onClick={() => toggleExpand(gsName)}
                className={style["expand-button"]}
              />
              <div className={style["name"]}>{gsName}</div>
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
                          // fromGradeStage
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
              onClick={() => toggleExpand(gsName)}
              style={{ display: !isExpanded ? "block" : "none" }}
            >
              <div className={style["axis-rotate-not-expansed"]}>
                <div
                  className={style["axis-title-not-expansed"]}
                  // style={{
                  //   background: `linear-gradient(to right, ${gradient.from}, ${gradient.to})`,
                  // }}
                >
                  <div style={{ width: "100px" }}>{gsName}</div>
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

export default GradeStageCard;
