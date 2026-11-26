// Content of one event in the DayCalendar time grid (split out of DayCalendar.tsx, issue #102).
import React from "react";
import { EyeInvisibleOutlined } from "@ant-design/icons";
import type { EventContentArg } from "@fullcalendar/core";
import styles from "./DayCalendar.module.css";
import { schemaMap, SchemaName, TeamMembers } from "../../../../types/types";
import { cssVar } from "../../../../theme/tokens";

type Props = {
  arg: EventContentArg;
  startHour?: string;
  endHour?: string;
  student?: TeamMembers;
  isStudentRole: boolean;
  activeHeaderType: string | null | undefined;
  teamMemberLength: number;
};

export default function DayEventContent({
  arg,
  startHour,
  endHour,
  student,
  isStudentRole,
  activeHeaderType,
  teamMemberLength,
}: Props) {
  const taskColor: SchemaName = arg.event.extendedProps.taskColor ?? "null";
  const axisColor: SchemaName = arg.event.extendedProps.axisColor ?? "null";
  const actualColor =
    !taskColor || taskColor === "null" || taskColor.toLowerCase() === "white"
      ? axisColor
      : taskColor;

  const hasExposure =
    arg.event.extendedProps?.hasExposure ||
    arg.event.extendedProps?.taskData?.hasExposure ||
    false;

  let taskSource: string = "assignment";

  if (activeHeaderType === "team") {
    if (
      arg.event.extendedProps?.items &&
      arg.event.extendedProps.items.length > 0
    ) {
      taskSource = arg.event.extendedProps.items[0].source;
    }
  } else {
    if (arg.event.extendedProps?.source) {
      taskSource = arg.event.extendedProps.source;
    }
  }

  return (
    <>
      <div
        style={
          startHour &&
          parseInt(startHour[1]) < new Date().getHours() &&
          endHour &&
          parseInt(endHour[1]) > new Date().getHours()
            ? {
                border: `4px solid ${cssVar("black")}`,
              }
            : undefined
        }
        className={styles["dayTaskContainer"]}
      >
        <div
          className={styles["dayTaskLine"]}
          style={{
            background: `linear-gradient(to right, ${schemaMap[actualColor]?.from}, ${schemaMap[actualColor]?.to})`,
            boxShadow: "inset 0 0 0 1px rgba(0, 0, 0, 0.2)", // TODO(tokens)
          }}
        />
        <div className={styles["eventCard"]}>
          {!isStudentRole && (
            <div className={styles["eventGroup"]}>
              {arg.event.extendedProps.groupName}
            </div>
          )}
          <div
            className={
              styles[
                taskSource === "assignment" ? "eventTask" : "eventTaskOccurrences"
              ]
            }
            style={
              student ? { fontWeight: "normal", fontSize: "1rem" } : undefined
            }
          >
            {arg.event.title}

            {hasExposure && (
              <EyeInvisibleOutlined
                style={{
                  fontSize: 14,
                  color: cssVar("black"),
                  marginRight: 4,
                }}
              />
            )}

            {taskSource === "assignment" ? "" : " - הרחבה"}
          </div>
          {arg.event.extendedProps.items?.length > 0 && !student
            ? `  ${
                teamMemberLength || arg.event.extendedProps.items?.length
              } / ${arg.event.extendedProps.items?.length}  מתוך הצוות`
            : null}
        </div>
      </div>
    </>
  );
}
