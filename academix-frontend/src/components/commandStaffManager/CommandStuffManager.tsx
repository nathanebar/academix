import React from "react";
import CardUI from "../../UI/Card/Card";
import style from "./commandStaffManager.module.css";
import { Button } from "antd";
type Props = {};

function CommandStuffManager({}: Props) {
  return (
    <div>
      {" "}
      <CardUI
        width={"30.15625vw"}
        height={"15.277777777777777vh"}
        title={<>הסגל הפיקודי</>}
        bodyStyle={{ paddingTop: 0 }}
      >
        <div className={style["add-button-container"]}>
          <div>הוסיפו את הסגל הפיקודי של הצוות</div>
          <Button className={style["add-button"]}>+</Button>
        </div>
      </CardUI>
    </div>
  );
}

export default CommandStuffManager;
