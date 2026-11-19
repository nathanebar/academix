import React, { ChangeEventHandler, ReactElement } from "react";
import style from "./StringInput.module.css";
import { Input } from "antd";

export type StringInputProps = {
  name: string;
  logos: ReactElement[];
  onChange: ChangeEventHandler<HTMLInputElement>;
  maxLength?: number;
  userTask?: boolean;
  value?: string;
  locked: boolean | undefined;
};

const StringInput = (props: StringInputProps) => {
  return (
    <div className={style.input_wrapper}>
      <Input
        // disabled = {props?.locked}
        placeholder={props.name}
        value={props.value}
        className={style.input}
        onChange={props.onChange}
        maxLength={props.maxLength ? props.maxLength : Infinity}
        suffix={
          <div
            className={style.logos_wrapper}
            style={{ width: `${props.logos.length * 1.3}vw` }}
          >
            {props.logos.map((logo, index) => (
              <div key={index}>
                <React.Fragment key={index}>{logo}</React.Fragment>
              </div>
            ))}
          </div>
        }
      />
    </div>
  );
};

export default StringInput;
