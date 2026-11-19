import { schemaMap, SchemaName } from "../../types/types";
import { CalendarOutlined, ClockCircleOutlined } from "@ant-design/icons";
import { EyeInvisibleOutlined } from "@ant-design/icons";
import { Tooltip } from "antd";
import style from "./MissionDiv.module.css";
import MissionProgressTimeline from "./HorizontalTimeline/HorizontalTimeline";
import { usePermissionStore } from "../../store/permissionStore";
import { formatDate } from "date-fns";
import { he } from 'date-fns/locale';
import { TeamOutlined } from "@ant-design/icons";
import { Button } from "antd";

import TaskUserTag from "../../components/Task/TaskTag/TaskUserTag";

const MissionDiv = ({
  mission,
  onClick,
  isCommanderOrAdmin = false,
  timelineVisible = true,
}: {
  mission: any;
  onClick: any;
  isCommanderOrAdmin?: boolean;
  timelineVisible: boolean;
}) => {
  const startDate: Date | null = mission.start ? new Date(mission.start) : null;

  const selectedPermission = usePermissionStore(
    (s) => s.selectedPermission?.role_code
  );

  const gradient =
    mission?.Task?.color !== undefined
      ? schemaMap[mission?.Task?.color as SchemaName]
      : schemaMap["null"];
  const backgroundColor = `linear-gradient(135deg, ${gradient?.from}, ${gradient?.to})`;

  const hasLateHours =
    mission.timeSinceEnd?.hours !== null &&
    mission.timeSinceEnd?.hours !== undefined &&
    mission.timeSinceEnd?.hours > 0;
  const hasLateDays =
    mission.timeSinceEnd?.days !== null &&
    mission.timeSinceEnd?.days !== undefined &&
    mission.timeSinceEnd?.days > 0;

  const isLocked = mission.extendedProps?.isLocked || mission.isLocked || false;
  const hasExposure =
    mission.extendedProps?.hasExposure || mission.hasExposure || false;
  return (
    <>
      <div
        style={{
          backgroundColor:
            hasLateHours || hasLateDays
              ? "rgba(244, 241, 235, 1)"
              : "rgba(244, 241, 235, 1)",
          position: "relative",
          opacity: isLocked ? 0.85 : 1,
        }}
        className={`${style.mainContainer}`}
        onClick={() => onClick(isLocked)}
      >
        <div
          className={style.missionColor}
          style={{
            background: backgroundColor,
            boxShadow: "inset 0 0 0 1px rgba(0, 0, 0, 0.2)",
          }}
        ></div>

        <div className={style.title}>
          <div
            style={{
              display: "flex",
              alignItems: "flex-start",
              gap: 8,
              width: "98%",
            }}
          >
            <span
              style={{
                fontSize: "13px",
                fontWeight: 600,
                flex: 1,
                color: "inherit",
              }}
            >
              {mission?.Task?.name || mission?.name}
              {/* {mission?.isOccurrence && " - הרחבה"} */}
            </span>

            {isCommanderOrAdmin && (
              <div onClick={(e) => e.stopPropagation()}>
                <TaskUserTag task={mission as any} />
              </div>
            )}

            {!(selectedPermission === "STUDENT") && (
              <div
                className={style.files_content}
                onClick={(e) => e.stopPropagation()}
              >
                {/* <StatusTag data={mission} /> */}
                {/* <TaskUserTag task={mission}  /> */}
              </div>
            )}


            {isLocked && (
              <Tooltip title="המשימה תיפתח רק בזמן השיבוץ">
                <EyeInvisibleOutlined
                  style={{
                    fontSize: 16,
                    flexShrink: 0,
                    marginTop: 2,
                  }}
                />
              </Tooltip>
            )}

            {isCommanderOrAdmin &&
              (mission.start_minutes_before > 0 ||
                mission.end_minutes_after > 0) && (
                <Tooltip title="משימה מתוזמנת - תוצג לחניך בזמן מסוים">
                  <ClockCircleOutlined
                    style={{
                      fontSize: 16,
                      color: "#000000cc",
                      flexShrink: 0,
                      marginTop: 2,
                    }}
                  />
                </Tooltip>
              )}

            {isCommanderOrAdmin && mission.extendedProps?.hasExposure && (
              <Tooltip title="חשיפה מופעלת - המשימה תוצג בכחול לפני/אחרי זמן השיבוץ">
                <EyeInvisibleOutlined
                  style={{
                    fontSize: 16,
                    color: "#6b7280",
                    flexShrink: 0,
                    marginTop: 2,
                  }}
                />
              </Tooltip>
            )}
          </div>
          {timelineVisible && <MissionProgressTimeline mission={mission} />}
          <span className={style.dateCompact}>

            {formatDate(new Date(mission.start), "EEEE, d בMMMM yyyy, HH:mm", { locale: he })}
          </span>
        </div>


        {/* <div className={style.badgesContainer}>
          <div
            className={style.statusDiv}
            style={{
              color: status.color,
              borderColor: status.borderColor,
            }}
          >
            {status.text}
          </div>
          {isLate && mission.Task.recommendedTime && (
            <div className={style.lateDiv}>
              {`באיחור ${
                mission.timeSinceEnd?.hours
                  ? mission.timeSinceEnd.hours
                  : mission.timeSinceEnd?.days
              } ${mission.timeSinceEnd?.hours ? "שעות" : "ימים"} `}
            </div>
          )}
        </div> */}
      </div>
    </>
  );
};

export default MissionDiv;
