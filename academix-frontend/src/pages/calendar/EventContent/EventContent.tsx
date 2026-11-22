import {
  UserOutlined,
  DatabaseOutlined,
  ClockCircleOutlined,
  FileSearchOutlined,
  DeleteOutlined,
  FieldTimeOutlined,
  EyeInvisibleOutlined,
  MessageOutlined,
} from "@ant-design/icons";
import { Avatar, Button, message, Tooltip } from "antd";
import dayjs from "dayjs";
import { Gradient, SchemaName } from "../../../types/types";
import style from "../Calendar.module.css";
import { TaskContainer } from "../TaskContainer/TaskContainer";
import { TaskHeader } from "../TaskHeader/TaskHeader";
import { CreatorBadge } from "../CreatorBadge/CreatorBadge";
import { AssignmentBankBadge } from "../AssignmentBankBadge/AssignmentBankBadge";
import { HiddenBadge } from "../HiddenBadge/HiddenBadge";
import { TaskProgress } from "../TaskProgress/TaskProgress";
import stringCheckAndToolTip from "../../../utils/stringCheck";
import TaskUserTag from "../../../components/Task/TaskTag/TaskUserTag";
import TaskTeamTag from "../../../components/Task/TaskTag/TaskTeamTag";
import { useState } from "react";
import EditTimeModal from "../../../components/Modals/EditTimeModal/EditTimeModal";
import { usePermissionStore } from "../../../store/permissionStore";
import HoefBadge from "../AssignmentBankBadge/HoefBadge/HoefBadge";

import { useDragAssignHoef } from "../../../hooks/useHoefAssignment";
import { queryClient } from "../../../api/queryClient";
import { useSelectionsStore } from "../../../store/selectionStore";

export const EventContent = ({
  arg,
  viewMode,
  schemaMap,
  handleOpenTaskModal,
  handleOpenTaskStatusModal,
  handleEventClick,
  activeHeaderType,
  isCommanderOrAdmin = false,
  handleDragStop,
}: {
  arg: any;
  viewMode: string;
  schemaMap: Record<string, { from: string; to: string }>;
  handleOpenTaskModal: () => void;
  handleOpenTaskStatusModal: (payload: any) => void;
  activeHeaderType: any;
  handleEventClick: (arg: any) => void;
  isCommanderOrAdmin?: boolean;
  handleDragStop: any;
}) => {
  const currentUrl = window.location.pathname;
  const [modalOpen, setModalOpen] = useState<boolean | any>();
  const selectedPermission = usePermissionStore(
    (s) => s.selectedPermission?.role_code
  );

  const { selectedTeam } = useSelectionsStore();

  const [isHovered, setIsHovered] = useState<boolean>(false);
  const isTeamEventAssignment: boolean = arg.event.extendedProps.TeamEventId!!;

  const titleParts = arg.event.title;
  const hour = arg.event.start ? dayjs(arg.event.start).format("HH:mm") : "";
  const durationMinutes =
    arg.event.start && arg.event.end
      ? dayjs(arg.event.end).diff(dayjs(arg.event.start), "minute")
      : 0;
  const isShortTask15 =
    durationMinutes === 15 && currentUrl.includes("calendar");
  const isShortTask30 =
    durationMinutes === 30 && currentUrl.includes("calendar");
  const taskTitle = titleParts;
  const taskColor: SchemaName =
    arg.event.extendedProps.taskColor || arg.event.backgroundColor;

  const axisColor: SchemaName = arg.event.extendedProps.axisColor;
  const actualColor =
    !taskColor || taskColor.toLowerCase() === "white" ? axisColor : taskColor;
  const isWhiteGradient =
    schemaMap[taskColor]?.from === "#ffffff" &&
    schemaMap[taskColor]?.to === "#ffffff";
  const darkOrNormal = (color: string | undefined) =>
    !isLocked && isWhiteGradient ? getDarkColor(colorValue) : color;
  const colorValue =
    schemaMap[actualColor] ||
    schemaMap[arg.event.backgroundColor] ||
    schemaMap[axisColor];
  const getDarkColor = (cv: typeof colorValue) => cv?.to || "#FF6B6B";

  // גרדיאנט עם שקיפות

  const isScheduled = Boolean(
    arg.event.extendedProps?.is_scheduled ||
      arg.event.extendedProps?.start_minutes_before > 0 ||
      arg.event.extendedProps?.end_minutes_after > 0
  );

  const isLocked = arg.event.extendedProps.isLocked || false;

  const taskAssignmentForTag = {
    id: arg.event.id,
    name: arg.event.title,
    totalmembers: arg.event.extendedProps.totalMembers || null,
    assignedcount: arg.event.extendedProps.assignedCount,
    completed: arg.event.extendedProps.completed || null,
    completed_at: arg.event.extendedProps.completed_at || null,
    task_assignment_id: arg.event.extendedProps.taskassignmentid || null,
    task_id: arg.event.extendedProps.task_id || null,
  };
  const note = arg.event.extendedProps?.note;
  const taskMinuts = arg.event.extendedProps.minuts;
  const is30Min = taskMinuts <= 30;
  const taskDescription = arg.event.extendedProps.taskDescription;
  const isOccurrence = arg.event.extendedProps.source === "occurrence" || arg.event.extendedProps.constant;
  const creatorName = arg.event.extendedProps.creatorName as string;
  const assignedByName = arg.event.extendedProps.assignedByName as
    | string
    | undefined;

  const simulateDeleteDrop = (e: React.MouseEvent) => {
    e.stopPropagation();
    const trashZone = document.getElementById("trash-zone");
    const trashRect = trashZone?.getBoundingClientRect();

    if (trashRect) {
      // Simulate a drop position inside the trash zone
      const fakeClientX = trashRect.left + 1;
      const fakeClientY = trashRect.top + 1;

      handleDragStop.mutate({
        jsEvent: { clientX: fakeClientX, clientY: fakeClientY },
        event: arg.event,
        startStr: arg.event.startStr || arg.event.start?.toISOString(),
      });
    }
  };
  function hexToRgba(hex: string, alpha = 1): string {
    const clean = hex.replace("#", "");
    const fullHex =
      clean.length === 3
        ? clean
            .split("")
            .map((c) => c + c)
            .join("")
        : clean;
    if (fullHex.length !== 6) {
      return "rgba(255, 240, 245, 1)";
    }
    const r = parseInt(fullHex.slice(0, 2), 16);
    const g = parseInt(fullHex.slice(2, 4), 16);
    const b = parseInt(fullHex.slice(4, 6), 16);
    const clampedAlpha = Math.min(1, Math.max(0, alpha));
    return `rgba(${r}, ${g}, ${b}, ${clampedAlpha})`;
  }

  const getTransparentGradient = (cv: Gradient, opacity: number = 0.5) => {
    if (!cv) return "rgba(255, 240, 245, 1)";
    return `${hexToRgba(cv.to, opacity)}`;
  };
  const renderLockedBadge = () => {
    if (!isLocked) return null;
    return (
      <Tooltip title="המשימה תיפתח רק בזמן השיבוץ">
        <EyeInvisibleOutlined
          style={{
            fontSize: 22,
            color: "#000000ff",
            marginRight: 4,
          }}
        />
      </Tooltip>
    );
  };

  const renderScheduledBadge = () => {
    if (!isScheduled || !isCommanderOrAdmin) return null;
    return (
      <Tooltip title="משימה מתוזמנת - תוצג לחניך בזמן מסוים">
        <ClockCircleOutlined
          style={{
            fontSize: 22,
            color: "#000000ff",
            marginRight: 4,
          }}
        />
      </Tooltip>
    );
  };

  const { removeTaskFromHoef } = useDragAssignHoef();

  const handleRemoveHoef = async (payload: any) => {
    const task = {
      task_assignment_id: payload.taskAssignmentId,
      task_name: payload.hoefName || "משימה", // או שם המשימה
    };

    const hoef = {
      hoef_member_id: payload.hoefTeamMemberId,
      name: payload.hoefName || "חופף",
    };

    const result = await removeTaskFromHoef(task, hoef);

    if (result.success) {
      message.success(result.message);
      queryClient.refetchQueries({
        queryKey: ["hoefs", "team", selectedTeam?.id],
      });

      queryClient.refetchQueries({
        queryKey: ["tasks-range"],
      });
    } else {
      message.error(result.message);
    }
  };

  const renderBadges = () => (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: 8,
        flexShrink: 0,
      }}
    >
      <CreatorBadge
        creatorName={creatorName}
        assignerName={assignedByName}
        size={isShortTask15 ? 16 : 24}
      />
      <div>
        {activeHeaderType != "team" ? (
          <HoefBadge
            task={{
              has_hoef: arg.event.extendedProps.has_hoef,
              hoef_name: arg.event.extendedProps.hoef_name,
              hoef_username: arg.event.extendedProps.hoef_username,
              hoef_image_url: arg.event.extendedProps.hoef_image_url,
              hoef_team_member_id: arg.event.extendedProps.hoef_team_member_id,
              student_name: arg.event.extendedProps.student_name,
              student_username: arg.event.extendedProps.student_username,
              id: arg.event.id,
              name: arg.event.title,
              taskAssignmentId: arg.event.extendedProps.taskassignmentid,
              occurrence_id: arg.event.extendedProps.occurrence_id,
              source: arg.event.extendedProps.source,
            }}
            onRemoveHoef={handleRemoveHoef}
            size={24}
          />
        ) : (
          <HoefBadge
            onRemoveHoef={handleRemoveHoef}
            items={arg.event.extendedProps.items}
            size={24}
          />
        )}
      </div>
      {note && note.trim() !== "" && (
        <Tooltip title={note} placement="top">
          <MessageOutlined
            style={{ color: "#1677ff", marginLeft: 4, fontSize: 18 }}
          />
        </Tooltip>
      )}
      {isLocked && (
        <Tooltip title="המשימה תיפתח רק בזמן השיבוץ">
          <EyeInvisibleOutlined
            style={{
              fontSize: 22,
              color: "#000000ff",
            }}
          />
        </Tooltip>
      )}
      {renderScheduledBadge()}
      {arg.event.extendedProps.status === "assignment_bank" && (
        <AssignmentBankBadge />
      )}
    </div>
  );
  
  if (viewMode === "dayGridMonth") {
    return (
      <div
        className={style["monthTaskContainer"]}
        onClick={() => handleOpenTaskStatusModal(arg.event.extendedProps)}
      >
        <div className={style["taskDiv"]}>
          <div
            className={style["monthTaskCircle"]}
            style={{
              background: ` linear-gradient(to right, ${schemaMap[taskColor]?.from}, ${schemaMap[taskColor]?.to})`,
              boxShadow: "inset 0 0 0 1px rgba(0, 0, 0, 0.2)",
            }}
          />
          <div
            style={{
              flex: 1,
              height: "100%",
              display: "flex",
              gap: 10,
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <Tooltip
                title={
                  <span style={{ fontSize: "medium" }}>
                    שובצה בשעה : {hour}{" "}
                  </span>
                }
              >
                {isTeamEventAssignment && <div>מבנק האירועים</div>}
                <span
                  style={{ fontSize: "medium", fontWeight: "bold", flex: 1 }}
                >
                  {stringCheckAndToolTip(taskTitle, 18)}
                </span>
              </Tooltip>
              {renderBadges()}
            </div>
          </div>
        </div>
      </div>
    );
  } else if (viewMode === "twoWeeks") {
    return (
      <div
        className={style["twoWeeksTaskContainer"]}
        onClick={() => handleOpenTaskStatusModal(arg.event.extendedProps)}
      >
        <div className={style["twoWeeksTaskDiv"]}>
          <div
            className={style["twoWeeksTaskCircle"]}
            style={{
              width: "12px",
              height: "12px",
              borderRadius: "50%",
              background: `linear-gradient(to right, ${schemaMap[taskColor]?.from}, ${schemaMap[taskColor]?.to})`,
              boxShadow: "inset 0 0 0 1px rgba(0, 0, 0, 0.2)",
              flexShrink: 0,
            }}
          />
          <Tooltip
            title={
              <span style={{ fontSize: "medium" }}> שובצה בשעה : {hour} </span>
            }
          >
            {isTeamEventAssignment && <div>מבנק האירועים</div>}
            <span style={{ fontSize: "medium", flex: 1 }}>
              {stringCheckAndToolTip(taskTitle, 17)}
            </span>
          </Tooltip>
          {renderBadges()}
        </div>
        <div className={style["twoWeeksTaskProgress"]} style={{ padding: 10 }}>
          {!arg.event.extendedProps?.notRequiredToSubmit &&
            !isOccurrence &&
            (activeHeaderType === "teamMember" ? (
              <TaskUserTag task={taskAssignmentForTag} />
            ) : (
              <TaskTeamTag task={taskAssignmentForTag} />
            ))}
        </div>
      </div>
    );
  } else if (viewMode === "timeGridWeek") {
    return (
      <>
        <Tooltip title={isShortTask15 ? undefined : arg.timeText}>
          <div
            className={style["weekTaskContainer"]}
            onClick={() => handleOpenTaskStatusModal(arg.event.extendedProps)}
            style={{
              background: getTransparentGradient(colorValue, 0.3),
              border: `2px ${
                isTeamEventAssignment ? "dashed" : "solid"
              } ${getDarkColor(colorValue)}`,
              borderRadius: "5px",
            }}
          >
            <div
              className={style["weeksTaskLine"]}
              // style={{
              //   background: `linear-gradient(to right, ${schemaMap[taskColor]?.from}, ${schemaMap[taskColor]?.to})`,
              //   boxShadow: "inset 0 0 0 1px rgba(0, 0, 0, 0.2)",
              // }}
              style={{
                background: getDarkColor(colorValue),
                boxShadow: "none",
              }}
            />
            <div className={style["weeksTaskHeader"]}>
              <div
                style={{
                  flex: 1,
                  height: "100%",
                  paddingRight: "5px",
                  display: "flex",
                  gap: 10,
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <TaskHeader
                    title={taskTitle}
                    hour={hour}
                    isOccurrence={isOccurrence}
                    maxLength={17}
                  />
                  {renderBadges()}
                </div>
              </div>
            </div>
            <div
              className={style["weeksTaskBody"]}
              style={{
                padding: !is30Min ? "0px 10px 0 10px" : "",
              }}
            >
              {taskMinuts > 30 ? taskDescription : ""}
            </div>
            <div
              className={style["weeksTaskProgress"]}
              onClick={(e) => e.stopPropagation()}
            >
              {/*  {
              <Tooltip title="פתח משימה">
                <Button
                  style={{ top: 0, left: 0 }}
                  icon={<FileSearchOutlined />}
                  onClick={(e) => {
                    e.stopPropagation();
                    handleEventClick(arg);
                    handleOpenTaskModal();
                  }}
                />
              </Tooltip>
            } */}
              {!arg.event.extendedProps?.notRequiredToSubmit &&
                !isOccurrence &&
                (activeHeaderType === "teamMember" ? (
                  <TaskUserTag task={taskAssignmentForTag} />
                ) : (
                  // <></>
                  <TaskTeamTag task={taskAssignmentForTag} />
                ))}
            </div>
          </div>
        </Tooltip>
      </>
    );
  } else if (viewMode === "timeGridDay") {
    return (
      <>
        <Tooltip title={arg.timeText}>
          <div
            className={style["dayTaskContainer"]}
            onClick={() => handleOpenTaskStatusModal(arg.event.extendedProps)}
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
            style={{
              background: getTransparentGradient(colorValue, 0.3),
              border: `2px ${
                isTeamEventAssignment ? "dashed" : "solid"
              } ${getDarkColor(colorValue)}`,
              borderRadius: "5px",
            }}
          >
            <div
              className={style["dayTaskLine"]}
              style={{
                background: `linear-gradient(to right, ${darkOrNormal(
                  schemaMap[taskColor]?.from
                )}, ${darkOrNormal(schemaMap[taskColor]?.to)})`,
                // boxShadow: "inset 0 0 0 1px rgba(0, 0, 0, 0.2)",
              }}
              // style={{
              //   background: getDarkColor(colorValue),
              //   boxShadow: "none",
              // }}
            />
            <div
              style={{
                flex: 1,
                // height: "100%",
                paddingRight: "5px",
                // paddingTop: is30Min ? "5px" : "10px",
                display: "flex",
                gap: 10,
              }}
            >
              <TaskHeader
                title={taskTitle}
                hour={hour}
                isOccurrence={isOccurrence}
                maxLength={17}
              />
              {renderBadges()}
              <p
                style={{
                  fontSize: "medium",
                  margin: 0,
                  color: "gray",
                }}
              >
                {taskDescription}
              </p>
            </div>
            <div className={style["dayTaskProgressDiv"]}>
              {isHovered && !isShortTask15 && (
                <p
                  style={{
                    fontSize: "medium",
                    fontWeight: "bold",
                    margin: 0,
                    color: "gray",
                  }}
                >
                  {arg.timeText}
                </p>
              )}
              <div
                className={style["dayTaskProgress"]}
                onClick={(e) => e.stopPropagation()}
              >
                {!isTeamEventAssignment &&
                  !arg.event.extendedProps?.notRequiredToSubmit &&
                  !isOccurrence &&
                  (activeHeaderType === "teamMember" ? (
                    <TaskUserTag
                      task={taskAssignmentForTag}
                      size={isShortTask15}
                    />
                  ) : (
                    <TaskTeamTag
                      task={taskAssignmentForTag}
                      size={isShortTask15}
                    />
                  ))}
              </div>
            </div>
            {activeHeaderType !== "teamMember" && (
              <div
                style={
                  isShortTask15 || isShortTask30
                    ? { width: "4vw" }
                    : {
                        height: "100%",
                        display: "flex",
                        flexDirection: "column-reverse",
                      }
                }
              >
                <Tooltip title="פתח משימה">
                  <Button
                    style={
                      isShortTask15
                        ? { width: "1.1vw", height: "1.4vh" }
                        : isShortTask30
                        ? { left: 3 }
                        : { position: "absolute", top: 0, left: 0 }
                    }
                    icon={<FileSearchOutlined />}
                    onClick={(e) => {
                      e.stopPropagation();
                      handleEventClick(arg);
                      handleOpenTaskModal();
                    }}
                  />
                </Tooltip>
                <Button
                  style={
                    isShortTask15
                      ? { width: "1.1vw", height: "1.4vh", right: 12 }
                      : {}
                  }
                  danger
                  icon={<DeleteOutlined />}
                  onClick={simulateDeleteDrop}
                />
              </div>
            )}
            {activeHeaderType === "teamMember" &&
              selectedPermission !== "STUDENT" && (
                <div
                  style={{
                    height: "100%",
                    borderColor: "red",
                    display: "flex",
                    flexDirection: "column-reverse",
                  }}
                >
                  <Tooltip title="שינוי זמני השיבוץ">
                    <Button
                      style={{ position: "absolute", top: 0, left: 0 }}
                      icon={<FileSearchOutlined />}
                      onClick={(e) => {
                        e.stopPropagation();
                        handleEventClick(arg);
                        handleOpenTaskModal();
                      }}
                    />
                  </Tooltip>
                  <Button
                    danger
                    icon={<DeleteOutlined />}
                    onClick={simulateDeleteDrop}
                  />
                </div>
              )}
            {activeHeaderType === "teamMember" &&
              selectedPermission !== "STUDENT" && (
                <div
                  style={{
                    height: "100%",
                    borderColor: "red",
                    display: "flex",
                    flexDirection: "column-reverse",
                  }}
                >
                  <Tooltip title="שינוי זמני השיבוץ">
                    <Button
                      style={{ position: "absolute", top: 0, left: 0 }}
                      icon={<FieldTimeOutlined />}
                      onClick={(e) => {
                        e.stopPropagation();
                        setModalOpen(true);
                      }}
                    />
                  </Tooltip>
                  {/*  <Button
                    danger
                    icon={<DeleteOutlined />}
                    onClick={simulateDeleteDrop}
                  /> */}
                </div>
              )}
          </div>
          <EditTimeModal
            isOpen={modalOpen}
            setIsOpen={setModalOpen}
            timeText={arg.timeText}
            user_id={arg.event._def.extendedProps.taskassignmentid}
          />
        </Tooltip>
      </>
    );
  }

  return <></>;
};
