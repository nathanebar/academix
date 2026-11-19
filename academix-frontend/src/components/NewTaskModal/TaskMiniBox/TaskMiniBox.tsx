import React from "react";
import style from "./TaskMiniBox.module.css";
import { Tooltip } from "antd";
import msg_icon from "../../../media/svg/msg_icon.svg";

export type TaskMiniBoxProps = {
  task: any;
};

export const improveText = (
  text: string,
  length: number,
  dotsToLeft?: boolean
): string | React.ReactElement => {
  if (text?.length > length) {
    return (
      <Tooltip color="gray" title={text}>
        {dotsToLeft
          ? "..." + text.substring(0, length)
          : text.substring(0, length) + "..."}
      </Tooltip>
    );
  }
  return text;
};

const TaskMiniBox = (props: TaskMiniBoxProps) => {
  return (
    <div className={style.wrapper}>
      <div className={style.title}>{props.task?.name}</div>
      <div className={style.description}>
        {improveText(props.task?.description, 45)}
      </div>
      <div className={style.notes}>
        <img
          src={msg_icon}
          alt="msg_icon"
          width={22.5}
          className={style.logo}
        />
        2
      </div>
    </div>
  );
};

export default TaskMiniBox;
