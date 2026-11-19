import React from "react";
import style from "./TaskMissionBulletForUser.module.css";
import { Tooltip } from "antd";

export type TaskMissionBulletForUserProps = {
  name: string;
  logo: React.ReactElement;
  done: boolean;
};

const divWithOrWithoutTooltip: (
  bool: boolean,
  content: React.ReactElement
) => React.ReactElement = (b, c) => {
  return b ? (
    <Tooltip color="gray" title={"המשימה הושלמה"}>
      {c}
    </Tooltip>
  ) : (
    <>{c}</>
  );
};

const TaskMissionBulletForUser = (props: TaskMissionBulletForUserProps) => {
  return divWithOrWithoutTooltip(
    props.done,
    <div
      className={style.wrapper}
      style={{ backgroundColor: props.done ? "#E8E1D3" : "white" }}
    >
      <div className={style.text}>{props.name}</div>
      <div className={style.logo}>{props.logo}</div>
    </div>
  );
};

export default TaskMissionBulletForUser;
