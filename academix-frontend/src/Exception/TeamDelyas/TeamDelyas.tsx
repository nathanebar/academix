import React from "react";
import style from "./TeamDelyas.module.css";
import { Tooltip } from "antd";
type Props = {
  name: string;
  value: number;
  color: string;
};
const TeamDelyas = (props: Props) => {
  return (
    <div className={style.container}>
      <div className={style.color} style={{ background: props.color }}></div>
      {props.name && props.name.length > 13 ? (
        <Tooltip title={props.name} mouseEnterDelay={0.3}>
          <span>{props.name.slice(0, 13)}...</span>
        </Tooltip>
      ) : (
        <span>{props.name}</span>
      )}
      {props.value && <b style={{ fontWeight: "bold" }}>{props.value}</b>}{" "}
    </div>
  );
};

export default TeamDelyas;
