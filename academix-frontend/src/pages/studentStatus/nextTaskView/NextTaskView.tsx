import React from "react";
import style from "./nextTaskView.module.css";
import { schemaMap } from "../../../types/types";
import dayjs, { Dayjs } from "dayjs";
import { notification, Tooltip } from "antd";
import { usePermissionStore } from "../../../store/permissionStore";
import { CalendarOutlined, EyeInvisibleOutlined } from "@ant-design/icons";

type Props = {
  task: any;
  start?: Dayjs;
  setSelectedTaskId: React.Dispatch<React.SetStateAction<number>>;
};

const NextTaskView = (props: Props) => {
  const selectedPermission = usePermissionStore((s) => s.selectedPermission);

  const isLocked =
    props.task?.isLocked || props.task?.extendedProps?.isLocked || false;

  const handleClick = () => {
    const isStudent = selectedPermission?.role_code === "STUDENT";

    if (isStudent && isLocked) {
      notification.warning({
        message: "המשימה נעולה",
        description: "המשימה תהיה זמינה רק בזמן השיבוץ",
        placement: "topRight",
        duration: 3,
      });
      return;
    }

    props.setSelectedTaskId(props.task.id);
  };

 const taskColor =
  schemaMap?.[props.task?.TaskGroup?.Axis?.color]?.from ||
  props.task?.TaskGroup?.Axis?.color ||
  "#c8c8c8";

  const start = props.start ? dayjs(props.start) : null;

  return (
    <div className={style["container"]}>

      <div style={{ fontWeight: "600", marginBottom: 8 ,width:'85%',fontSize:15,color:'#5b6472' }}>המשימה הבאה בלוז</div>

      {props.task?.name ? (
        <div
          onClick={handleClick}
          className={style["dayTaskContainer"]}
        >
        
 <span
    className={style["timeBar"]}
    style={{
      background: `linear-gradient(180deg, ${taskColor}, ${taskColor}cc)`,
    }}
  />

          <div
            className={style["timeCube"]}
            style={{
              color:'#8a93a2'
            }}
          >
         
          <span className={style["timeCubeDay"]}>
    {start ? start.format("DD.MM") : "--.--"}
  </span>
  
  <span className={style["timeCubeHour"]}>
    {start ? start.format("HH:mm") : "--:--"}
  </span>
          </div>

     
          <div className={style["content"]}>
            <div className={style["rowTop"]}>
              <span className={style["name"]}>{props.task.name}</span>
              {isLocked && (
                <Tooltip title="המשימה תיפתח רק בזמן השיבוץ">
                  <EyeInvisibleOutlined className={style["lockIcon"]} />
                </Tooltip>
              )}
            </div>

            <div className={style["rowGroup"]}>
              <span className={style["group"]}>
                {props.task?.TaskGroup?.name}
              </span>
            </div>

           {/*  {start && (
              <div className={style["rowBottom"]}>
                <span className={style["rangeTime"]}>
                  {start.format("HH:mm")} · {start.format("DD/MM")}
                </span>

                {props.task?.recommendedTime != null && (
                  <span className={style["badge"]}>
                    ⏱ {props.task.recommendedTime}
                  </span>
                )}
              </div>
            )} */}
          </div>
        </div>
      ) : (
        <div className={style["emptyState"]}>
          <CalendarOutlined className={style["emptyIcon"]} />
          <div className={style["emptyTitle"]}>עוד לא שובצו משימות</div>
          <div className={style["emptySubtitle"]}>
            כשיהיו משימות בלוח, המשימה הבאה תופיע כאן
          </div>
        </div>
      )}
    </div>
  );
};

export default NextTaskView;