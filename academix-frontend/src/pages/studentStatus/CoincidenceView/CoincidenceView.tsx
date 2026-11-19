import React, { useState } from "react";
import style from "./CoincidenceView.module.css";
import dayjs from "dayjs";
import { ArrowLeftOutlined, QuestionCircleOutlined } from "@ant-design/icons";
import { ConfigProvider, message, Popconfirm, Radio, Tooltip } from "antd";
import { updateTaskAssignmentsCompleted } from "../../../services/ApiServices";
import TaskUserTag from "../../../components/Task/TaskTag/TaskUserTag";
import FormStatusTag from "../FormStatusTag/FormStatusTag";
import { useNavigate } from "react-router-dom";
import { useSelectionsStore } from "../../../store/selectionStore";

type Props = {
  formsLength: number;
  forms: any;
  tasks: any;
  
  feedbacks: any;
  setTasks: React.Dispatch<React.SetStateAction<any>>;
  tasksLength: number;
  setShowForms: React.Dispatch<React.SetStateAction<boolean>>;
  setSelectedTaskId: React.Dispatch<React.SetStateAction<number>>;
};

type TabType = "forms" | "tasks" | "feedbacks" | null;

const CoincidenceView = (props: Props) => {
  const [activeTab, setActiveTab] = useState<TabType>("forms");

    const {
    
      selectedTeam,
    } = useSelectionsStore();

  const feedbacksLength = props.feedbacks?.length || 0;
  const alertColor = (count: number) => (count > 0 ? "#d86a6a" : "#3aa66b");

  const tabs: { key: Exclude<TabType, null>; title: string; count: number }[] = [
    { key: "forms", title: "מבחנים", count: props.formsLength },
    { key: "tasks", title: "משימות", count: props.tasksLength },
    { key: "feedbacks", title: "משובים", count: feedbacksLength },
  ];

   const navigate = useNavigate();
  const toggleTab = (tab: Exclude<TabType, null>) => {
    setActiveTab((current) => (current === tab ? null : tab));
  };

  const renderContent = () => {
    switch (activeTab) {
      case null:
        return null;

      case "forms":
        return props.forms
          ?.sort(
            (a: any, b: any) =>
              new Date(a.end).getTime() - new Date(b.end).getTime()
          )
          .map((form: any, index: number) => (
            <div
              key={form.id ?? index}
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
          ));

      case "tasks":
        return props.tasks?.map((task: any, index: number) => (
          <div key={task.Task?.id ?? index} className={style["item"]}>
            <div
              className={style["itemBody"]}
              onClick={() => props.setSelectedTaskId(Number(task.Task.id))}
            >
              <div className={style["itemRow"]}>
                <span className={style["itemTitle"]}>
                  {task.Task.name.length > 14
                    ? task.Task.name.slice(0, 14) + "..."
                    : task.Task.name}
                </span>
                <span className={style["itemTime"]}>
                  {dayjs(task.start).format("DD/MM HH:mm")}
                </span>
              </div>
              <div className={style["itemFooter"]}>
                <ConfigProvider
                  theme={{
                    components: {
                      Radio: {
                        colorPrimary: "rgb(136,136,126)",
                        colorBgBase: "rgb(136,136,126)",
                      },
                    },
                  }}
                >
                  <Popconfirm
                    title="האם אתה בטוח שאתה רוצה לאשר את המשימה"
                    onConfirm={() => {
                      updateTaskAssignmentsCompleted(task.task_assignment_id);
                      props.setTasks((prev: any[]) =>
                        prev.filter((t: any) => t.id !== task.id)
                      );
                    }}
                  >
                    <TaskUserTag task={task} />
                  </Popconfirm>
                </ConfigProvider>
              </div>
            </div>
          </div>
        ));

      case "feedbacks":
  return props.feedbacks?.map((feedback: any, index: number) => {
    const hasAnswer =
      (feedback.answers?.length ?? 0) > 0 ||
      !!feedback.answer ||
      !!feedback.feedback_answer ||
      !!feedback.answered_at ||
      !!feedback.response;

const handleOpenFeedback = () => {


  const taskAssignmentId =
    feedback.assignmentId ?? feedback.id ?? feedback.assignmentIds?.[0];

  // מזהה המשימה — מגיע מהשרת
  const taskId = feedback.taskId;

  if (!taskId || !taskAssignmentId) {
    message.error("לא ניתן לפתוח את המשוב - חסר מידע");
    return;
  }

  if (!selectedTeam?.id) {
    message.error("לא נבחר צוות");
    return;
  }

  const startDate = feedback.start; // תאריך התחלת השיבוץ מהשרת

  const endDate = feedback.end; // תאריך סיום השיבוץ מהשרת

  if (!startDate) {
    message.error("לא ניתן לפתוח את המשוב - חסר תאריך התחלה");
    return;
  }

  const dates = `${startDate},${startDate},${startDate}`;
  const assignmentIds = String(taskAssignmentId);

  navigate(
    `/feedback/${taskId}/fill/${selectedTeam.id}?dates=${encodeURIComponent(
      dates
    )}&assignmentIds=${assignmentIds}`
  );
};

    return (
     <div key={feedback.id ?? index} className={style["item"]}>
  <div
    className={style["itemBody"]}
    onClick={handleOpenFeedback}
    title="לחץ כדי לעבור למענה המשוב"
    role="button"
    tabIndex={0}
    onKeyDown={(e) => {
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        handleOpenFeedback();
      }
    }}
  >
    <div className={style["itemRow"]}>
      <span className={style["itemTitle"]}>
        {typeof feedback === "string" ? feedback : feedback.feedbackName}
      </span>
      {feedback.start && (
        <span className={style["itemTime"]}>
          {dayjs(feedback.start).format("DD/MM HH:mm")}
        </span>
      )}
    </div>

    <div className={style["itemFooter"]}>
      {!hasAnswer ? (
        <>
          <span className={style["pendingTag"]}>לא ניתן מענה</span>
          <span className={style["answerLink"]}>
            מעבר למענה <ArrowLeftOutlined />
          </span>
        </>
      ) : (
        <span className={style["answeredTag"]}>ניתן מענה</span>
      )}
    </div>
  </div>
</div>
    );
  })
    }
  };

  return (
    <div className={style["container"]}>
      <div className={style["header"]}>
        <span className={style["title"]}>חריגות - צד חופף</span>
        <Tooltip
          title="כאן תוכלו לראות את כל החריגות של הצד החופף — משובים שלא הוחזרו, משימות ומבחנים שלא נבדקו."
          placement="top"
          color="#5b6472"
        >
          <QuestionCircleOutlined className={style["infoIcon"]} />
        </Tooltip>
      </div>

      <div className={style["card"]}>
        <div className={style["menu"]}>
          {tabs.map((tab) => (
            <div
              key={tab.key}
              className={
                activeTab === tab.key
                  ? `${style["tab"]} ${style["tabActive"]}`
                  : style["tab"]
              }
              onClick={() => toggleTab(tab.key)}
            >
              <span>{tab.title}</span>
              <span
                className={style["tabCount"]}
                style={{ color: alertColor(tab.count) }}
              >
                {tab.count}
              </span>
            </div>
          ))}
        </div>

        {activeTab && <div className={style["items"]}>{renderContent()}</div>}
      </div>
    </div>
  );
};

export default CoincidenceView;