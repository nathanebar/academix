import React, { FunctionComponent, useState, useEffect } from "react";
import style from "./ColorPicker.module.css";
import { colors, schemaMap, SchemaName } from "../../../../types/types";
import { useTaskStore } from "../../../../store/taskStore";
interface Props {
  selectedColor: any;
  setColor: React.Dispatch<React.SetStateAction<any>>;
  setIsChange: any;
  locked?: boolean | undefined;
}

const ColorPicker: FunctionComponent<Props> = (props) => {
  const setTaskInStore = useTaskStore((state) => state.addTask);
  const taskInStore = useTaskStore((state) => state.task);

  return (
    <div className={style.wrapper}>
      <div className={style["colors-container"]}>
        {colors.map((color) => {
          const gradient = schemaMap[color as SchemaName];
          return (
            <div
              key={color}
              className={`${style["color-option"]} ${
                props.selectedColor === color ? style["selected"] : ""
              }`}
              style={{
                background: `linear-gradient(135deg, ${gradient.from}, ${gradient.to})`,
                cursor:props?.locked ?'auto':'pointer'
              }}
              onClick={() => {
                if (props?.locked) return;
                props.setColor(color);
                setTaskInStore({
                  ...taskInStore,
                  color: color,
                });
                props.setIsChange(true);
              }}
            />
          );
        })}
      </div>
    </div>
  );
};

export default ColorPicker;
