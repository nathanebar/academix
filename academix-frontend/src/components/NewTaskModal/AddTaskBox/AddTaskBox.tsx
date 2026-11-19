import React, { ReactElement, useState } from "react";
import style from "./AddTaskBox.module.css";
import { Task } from "../../../store/taskStore";
import { Tooltip } from "antd";
import { LockOutlined } from "@ant-design/icons";

export type BoxProps = {
  id: number;
  name: string;
  logo: ReactElement;
  required?: boolean;
  selected: boolean;
  disabled?: boolean;
  disabledTooltip?: string;
  handleClick: (props: BoxProps) => void;
  component?: ReactElement;
  fieldInStore?: keyof Task;
  locked?: boolean;
  TooltipText?: string;
};

const AddTaskBox = (props: BoxProps) => {
  const [showTooltip, setShowTooltip] = useState(false);

  const getTooltipTitle = (): string => {
    if (props.disabled && props.disabledTooltip) {
      return props.disabledTooltip;
    }
    return props.TooltipText || "";
  };

  const boxContent = (
    <div
      className={`
        ${props?.locked ? style.wrapper : style.Editwrapper} 
        ${props.disabled ? style.disabled : ""} 
      `}
      onClick={() => {
        if (props?.locked || props.disabled) return;
        props.handleClick(props);
      }}
      onMouseEnter={() => setShowTooltip(true)}
      onMouseLeave={() => setShowTooltip(false)}
      style={{
        backgroundColor: props.selected ? "#E8E1D3" : "white",
        cursor: props.locked || props.disabled ? "not-allowed" : "pointer",
        opacity: props.disabled ? 0.5 : 1,
      }}
    >
      {props.disabled && (
        <LockOutlined 
          className={style.lockIcon} 
          style={{ color: "#999" }}
        />
      )}
      <div className={style.text}>{props.name}</div>
      <div className={style.logo}>{props.logo}</div>
    </div>
  );

  if (getTooltipTitle()) {
    return (
      <Tooltip 
        open={showTooltip} 
        title={getTooltipTitle()}
        placement="left"
      >
        {boxContent}
      </Tooltip>
    );
  }

  return boxContent;
};

export default AddTaskBox;