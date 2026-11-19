import React, { useEffect, useState } from "react";
import style from "./ResponseFile.module.css";
import logo from "../../../../media/svg/healthiconsi-exam-qualification-outline.svg";
import { useTaskStore } from "../../../../store/taskStore";
import DesignedSwitch from "../../DesignedSwitch/DesignedSwitch";


const ResponseFile = () => {
  const taskInStore = useTaskStore((state) => state.task);
  const setTaskInStore = useTaskStore((state) => state.addTask);
  const [require, setRequire] = useState<boolean>(false);
  useEffect(() => {
    setTaskInStore({ ...taskInStore, filesResponse: true });
  }, [require]);
  return (
    <div className={style.wrapper}>
      <div className={style.rightSide}>
        <div className={style.text}> נדרש להעלות קובץ בסוף המשימה!</div>
        {/* <DesignedSwitch
          state={require}
          setState={setRequire}
          checkedText="כן"
          unCheckedText="לא"
          width="7vw"
          fontSize="1rem"
        /> */}
      </div>
      <div className={style.logo}>
        <img
          src={logo}
          style={{ width: "1.8rem", marginTop: ".5vh" }}
          className={style.svgs}
        />
      </div>
    </div>
  );
};

export default ResponseFile;
