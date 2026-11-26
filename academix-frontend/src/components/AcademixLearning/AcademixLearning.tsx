import { Modal, Steps } from "antd";
import style from "./AcademixLearning.module.css";
import { useState } from "react";
import LearningCarusel from "../../utils/LearningCarusel/LearningCarusel";
import { cssVar, radius } from "../../theme/tokens";
import {
  taskRepository,
  AxesGant,
  NewTask,
  TaskAssignment,
  AxesView,
  Forms,
  Feedbacks,
  Surveys,
} from "../../utils/LearningData";
type Props = { isOpen: boolean; handleClose: () => void };

const learningSubjects = [
  {
    id: 1,
    title: "גאנט צירים וקבוצת תרגילים",
  },
  {
    id: 2,
    title: " יצירת תרגיל חדש",
  },
  {
    id: 3,
    title: "מאגר משימות",
  },
  {
    id: 4,
    title: " שיבוץ משימות ומעקב ביצוע",
  },
  {
    id: 5,
    title: " תצוגות וכלי ניהול בתכני קורס",
  },
  {
    id: 6,
    title: "שאלונים | מבחנים",
  },
  {
    id: 7,
    title: "סקרים",
  },
  {
    id: 8,
    title: "משובים, יצירת תבניות ומתן משוב",
  },
];

const AcademixLearning = (props: Props) => {
  const [currentSubject, setCurrentSubject] = useState<number>(1);

  let slides;

  switch (currentSubject) {
    case 1:
      slides = AxesGant;
      break;
    case 2:
      slides = NewTask;
      break;
    case 3:
      slides = taskRepository;
      break;
    case 4:
      slides = TaskAssignment;
      break;
    case 5:
      slides = AxesView;
      break;
    case 6:
      slides = Forms;
      break;
    case 7:
      slides = Feedbacks;
      break;
    default:
      slides = Surveys;
  }

  return (
    <Modal
      className={style["wrapper"]}
      classNames={{ content: style["modal"] }}
      open={props.isOpen}
      onCancel={props.handleClose}
      footer={null}
      styles={{ content: { padding: 0, borderRadius: radius["30"] } }}
    >
      <div className={style.modal_learning_details}>
        <div className={style.modalRightDiv}>
          <div className={style.modalRightDivTitle}>לומדה ACADEMIX</div>
          <hr className={style.separator}></hr>
          <div className={style.modalRightDivParts}>
            <ul className={style.subjects_ul}>
              {learningSubjects.map((sub: any) => {
                const isActive = sub.id === currentSubject;
                return (
                  <li
                    className={style.subject}
                    key={sub.id}
                    onClick={() => setCurrentSubject(sub.id)}
                    style={{
                      color: isActive ? cssVar("navy800") : "gray", // TODO(tokens): gray
                      fontWeight: isActive ? 700 : 300,
                    }}
                  >
                    {sub.title}
                  </li>
                );
              })}
            </ul>
          </div>
        </div>
        <div className={style.leftDiv}>
          <LearningCarusel slides={slides} />
        </div>
      </div>
    </Modal>
  );
};

export default AcademixLearning;
