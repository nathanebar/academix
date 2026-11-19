import React from "react";
import style from "./DesignedSwitch.module.css";

export type DesignedSwitchProps = {
  state: boolean;
  setState: React.Dispatch<React.SetStateAction<boolean>>;
  checkedText: string;
  unCheckedText: string;
  width?: string;
  styles?: { wrapper?: React.CSSProperties; content?: React.CSSProperties };
  fontSize: string;
};

const DesignedSwitch = (props: DesignedSwitchProps) => {
  return (
    <div
      className={style.switchWrapper}
      style={{ width: props.width, ...props.styles?.wrapper }}
      onClick={() => props.setState((prev) => !prev)}
    >
      <div
        className={style.option}
        style={{
          backgroundColor: props.state ? "white" : "transparent",
          fontSize: props.fontSize,
          marginRight: "7px",
          ...props.styles?.content,
        }}
      >
        {props.checkedText}
      </div>
      <div
        className={style.option}
        style={{
          backgroundColor: props.state ? "transparent" : "white",
          fontSize: props.fontSize,
          ...props.styles?.content,
        }}
      >
        {props.unCheckedText}
      </div>
    </div>
  );
};

export default DesignedSwitch;
