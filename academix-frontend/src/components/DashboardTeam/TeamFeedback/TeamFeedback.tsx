import style from "./TeamFeedback.module.css";
import { ReactComponent as PathIcon } from "../../../media/icons/Path.svg";

const TeamFeedback = () => {
  return (
    <div className={style.mainContainer}>
      <div className={style.title}>
        <p
          style={{
            fontWeight: 600,
            fontSize: "15px",
            color: "GrayText",
          }}
        >
          משובים
        </p>
      </div>
      <div className={style.deatilesDiv}>
        <div className={style.feedbacksView}>
          <div style={{ flex: 1 }} className={style.discrepencyDiv}>
            <div className={style.discrepencyCircle}>
              <span style={{fontWeight:700,fontSize:'25px'}}>3</span>
              <span>חריגות</span>
            </div>
          </div>

          <div style={{ flex: 1 }} className={style.feedbackWaitingDiv}>
            <div className={style.feedbackWaitingCircle}>
              <span style={{fontWeight:700,fontSize:'30px'}}>45</span>
              <span>ממתין למשוב</span>
            </div>
          </div>
          <div style={{ flex: 1 }} className={style.weeklyFeedbacksDiv}>
            <div className={style.weeklyFeedbacksCircle}>
              <span style={{fontWeight:700,fontSize:'35px'}}>45</span>
              <span>משובים השבוע</span>
            </div>
          </div>
        </div>
        <div className={style.feedbacksTimes}>
          <div className={style.feedbacksDeatiles}>
            <span style={{ fontSize: "x-large" }}>02:23:34</span>
            <p style={{ fontSize: "medium" }}>זמן תגובה ממוצע למשוב</p>
          </div>
          <div className={style.feedbacksDeatiles}>
            <span style={{ fontSize: "x-large" }}>
              23% <PathIcon />
            </span>
            <p style={{ fontSize: "medium", textWrap: "wrap", width: "80%" }}>
              ירידה בהצלחה בתחום "שמע" במשובים
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TeamFeedback;
