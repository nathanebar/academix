import { Task } from "../../../../store/taskStore";
import { feedbackType } from "../../../../types/types";
import style from "./expectionSoldier.module.css";

type Props = { task: Task; feedbacks: feedbackType[]; usersTask?: [] };
const ExceptionSoldiers = (props: Props) => {
  // here need to take new ui-ux from zimmer and change
  return (
    <div className={style.exceptionsDiv}>
      <div className={style.exceptionsContent}>
        <div className={style.pinkDiv}>
          <div className={style.green}>
            <div className={style.pinkDetailes}>
              <span style={{ fontWeight: 700, fontSize: "25px" }}>
                {" "}
                {props.task?.completed_all_tm_ids?.length}
              </span>
              <span>בוצע ואושר</span>
            </div>
          </div>
        </div>
        <div className={style.pinkDiv}>
          <div className={style.green}>
            <div className={style.pinkDetailes}>
              <span
                style={{
                  fontWeight: 700,
                  fontSize: "25px",
                }}
              >
                {" "}
                {props.task?.completed_at_only_tm_ids?.length}
              </span>
              <span>בוצע</span>
            </div>
          </div>
        </div>
        <div className={style.pinkDiv}>
          <div className={style.green}>
            <div className={style.pinkDetailes}>
              <span
                style={{
                  fontWeight: 700,
                  fontSize: "25px",
                }}
              >
                {" "}
                {props.task?.completed_only_tm_ids?.length}
              </span>
              <span>אושר</span>
            </div>
          </div>
        </div>
        <div className={style.redDiv}>
          <div className={style.red}>
            <div className={style.redDetailes}>
              <span style={{ fontWeight: 700, fontSize: "30px" }}>
                {" "}
                {props.task &&
                props.task?.completed_all_tm_ids &&
                props.task?.completed_at_only_tm_ids &&
                props.task?.completed_only_tm_ids &&
                props.usersTask
                  ? props.usersTask.length -
                    props.task?.completed_all_tm_ids?.length -
                    props.task?.completed_at_only_tm_ids?.length -
                    props.task?.completed_only_tm_ids?.length
                  : 0}
              </span>
              <span>בתהליך </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ExceptionSoldiers;
