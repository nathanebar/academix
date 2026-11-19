import React from "react";
import style from "./NewTask.module.css";
import { confirmTaskById } from "../../services/ApiServices";

type Props = {
  description: string;
  byUser: string;
  is_seen: boolean | null;
  id:number
};

const NewTask = (props: Props) => {
  return (

      <div
      className={style["mission"]}>
        {!props.is_seen &&<div style={{marginRight: '8px'}} onClick={()=>confirmTaskById(props.id)} className={style.confirmTask}></div>}
        <div style={{marginRight: '0.5vw'}}> משימה חדשה בשם {props.description} נוצרה על ידי {props.byUser}</div>
      </div>

  );
};

export default NewTask;
