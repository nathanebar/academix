import React, { useState } from "react";

import style from "./statusStudentView.module.css";
import dayjs from "dayjs";
import { CheckCircleOutlined, QuestionCircleOutlined } from "@ant-design/icons";
import TaskUserTag from "../../../components/Task/TaskTag/TaskUserTag";
import { Tooltip } from "antd";
import FormStatusTag from "../FormStatusTag/FormStatusTag";

type Props = {
  formsLength: number;
  forms: any;
  tasks: any;
  setTasks: React.Dispatch<React.SetStateAction<any>>;
  tasksLength: number;
  setShowForms: React.Dispatch<React.SetStateAction<boolean>>;
  setSelectedTaskId: React.Dispatch<React.SetStateAction<number>>;
  showForms: boolean;
  userName?:string;
};


const StatusStudentView = (props: Props) => {



 
  
  const [showEmpty, setShowEmpty] = useState<boolean>(false);

  const alertColor = (count: number) => (count > 0 ? "#d86a6a" : "#3aa66b");

  return (
    <div className={style["container"]}>
      <div className={style["header"]}>
        <span className={style["title"]}>חריגות - צד חניך</span>
         <Tooltip
      title="חריגות של החניך = מבחנים או משימות שמוגדרות 'חובת הגשה' ולא הוגשו עד למועד האחרון ."
      placement="top"
      color="#5b6472"
    >
      <QuestionCircleOutlined className={style["infoIcon"]} />
    </Tooltip>

        {!showEmpty && (
          <span className={style["badgeCount"]}>
            {props.showForms ? props.formsLength : props.tasksLength} חריגות
          </span>
        )}
      </div>

      <div className={style["card"]}>
        {/* ── הטאבים ─────────────────────────── */}
        <div className={style["menu"]}>
          <div
            className={
              props.showForms && !showEmpty
                ? `${style["tab"]} ${style["tabActive"]}`
                : style["tab"]
            }
            onClick={() => {
              props.setShowForms(true);
              if (props.showForms && !showEmpty) {
                setShowEmpty(true);
              } else {
                setShowEmpty(false);
              }
            }}
          >
            <span>מבחנים</span>
            <span
              className={style["tabCount"]}
              style={{ color: alertColor(props.formsLength) }}
            >
              {props.formsLength}
            </span>
          </div>

          <div
            className={
              !props.showForms && !showEmpty
                ? `${style["tab"]} ${style["tabActive"]}`
                : style["tab"]
            }
            onClick={() => {
              props.setShowForms(false);
              if (!props.showForms && !showEmpty) {
                setShowEmpty(true);
              } else {
                setShowEmpty(false);
              }
            }}
          >
            <span>משימות</span>
            <span
              className={style["tabCount"]}
              style={{ color: alertColor(props.tasksLength) }}
            >
              {props.tasksLength}
            </span>
          </div>
        </div>

        {/* ── תוכן ───────────────────────────── */}
        {!showEmpty && (
          <div className={style["items"]}>
            {props.showForms
              ? props.forms
                  ?.sort(
                    (a: any, b: any) =>
                      new Date(a.end).getTime() - new Date(b.end).getTime()
                  )
                  ?.map((form: any, index: number) => (
                    <div
                      key={form.taskId ?? index}
                      onClick={() => props.setSelectedTaskId(Number(form.taskId))}
                      className={style["item"]}
                    >
                      <div className={style["itemBody"]}>
                        <div className={style["itemRow"]}>
                          <span className={style["itemTitle"]}>
                            {form.formTitle.length > 14
                              ? form.formTitle.slice(0, 14) + "..."
                              : form.formTitle}
                          </span>
                          <span className={style["itemTime"]}>
                            {dayjs(form.end).format("DD/MM HH:mm")}
                          </span>
                        </div>

                        <div className={style["itemFooter"]}>
           
              <FormStatusTag form={form} />
            </div>
                        <div className={style["itemSub"]}>
                          מתוך משימה ({form.taskName})
                        </div>
                      </div>
                    </div>
                  ))
              : props.tasks &&
                props.tasks?.map((task: any, index: number) => (
                  <div key={task.Task?.id ?? index} className={style["item"]}>
                    <div className={style["itemBody"]}  onClick={() =>
                            props.setSelectedTaskId(Number(task.Task.id))
                          }>
                      <div className={style["itemRow"]}>
                        <span
                         
                          className={style["itemTitle"]}
                        >
                          {task.Task.name.length > 14
                            ? task.Task.name.slice(0, 14) + "..."
                            : task.Task.name}
                        </span>
                        <span className={style["itemTime"]}>
                          {dayjs(task.start).format("DD/MM HH:mm")}
                        </span>
                      </div>
 
                      
                      <div className={style["itemFooter"]}  onClick={(e) => e.stopPropagation()}   >
                        <TaskUserTag task={task} userName={props?.userName} />
                      </div>
                    </div>
                  </div>
                ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default StatusStudentView;