import React from "react";
import style from "./ProgressBar.module.css";

interface progProps {
  percent: number;
  color:string;
}

const ProgressBar = ({ percent ,color}: progProps) => {
  return (
      <div className={style["progress-container-fluid"]}>
        <div /* style={{ width: 100 }} */></div>
        <div className={style["progress-container"]}>
          <div
            className={style["progress-bar"]}
            style={{
              width: `${percent}%`,
              backgroundColor:color
            }}
          />
        </div>
      </div>
  );
};

export default ProgressBar;
