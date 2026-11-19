import React from "react";
import style from "./CertificationSteps.module.css";
import { Tooltip } from "antd";
type Props = {
  name: string;
  value?: number;
  color?: string;
  changeMode?: () => void;
  backgroundColor?: string;
};

const CertificationSteps = (props: Props) => {
  return (
    <div
      onClick={props.changeMode ? props.changeMode : () => {}}
      className={style.container}
      style={{
        cursor: props.color ? "" : "pointer",
        background: props.backgroundColor,
      }}
    >
      {props.color && (
        <div className={style.color} style={{ background: props.color }}></div>
      )}
      <div
        className={style["text"]}
        style={{ direction: "ltr", textAlign: "left" }}
      >
        {props.color ? "" : props.value ? "איחורים צוות" : ""}
        {props.value && (
          <b style={{ fontWeight: "bold" }}>{props.value}</b>
        )}{" "}
        {props.name && props.name.length > 13 ? (
          <Tooltip title={props.name} mouseEnterDelay={0.3}>
            <span>{props.name.slice(0, 13)}...</span>
          </Tooltip>
        ) : (
          <span>{props.name}</span>
        )}
      </div>
    </div>
  );
};

export default CertificationSteps;
