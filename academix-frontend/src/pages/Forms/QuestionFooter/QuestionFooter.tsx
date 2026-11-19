// UI/QuestionFooter/QuestionFooter.tsx
import { Tooltip } from "antd";
import { ReactComponent as EditIcon } from "../../../media/icons/Edit Icon.svg";
import { usePermissionStore } from "../../../store/permissionStore";
import { useSearchParams } from "react-router-dom";
import style from "./QuestionFooter.module.css";
import FormGrade from "../../../UI/FormGrade/FormGrade";

const QuestionFooter = ({ props, trigger, setTrigger }: any) => {
  const { selectedPermission } = usePermissionStore();
  const [searchParams] = useSearchParams();
  const isSurvey = searchParams.get("isSurvey");
  const sub = props.submission?.[0];
  const note = sub?.instructor_note || "";

  /* ---------- SHOW : note + note du correcteur + icône édition ---------- */
  if (props.renderFor === "show" && !trigger && !isSurvey) {
    const canEdit =
      selectedPermission?.role_code !== "STUDENT" &&
      selectedPermission?.role_code !== "OVERLAP";

    return (
      <div className={style.footer}>
        <div className={style.gradeBox}>
          <span className={style.gradeBadge}>
            {sub?.pointEarned ?? 0}/{props.points ?? 0}
          </span>
          <span className={style.note}>
            <span className={style.noteLabel}>הערת הבודק/ת: </span>
            {note ? (
              <Tooltip color="gray" title={note.length >= 80 ? note : ""}>
                <span>
                  {note.length >= 80 ? `${note.substring(0, 74)}...` : note}
                </span>
              </Tooltip>
            ) : (
              <span className={style.noNote}>—</span>
            )}
          </span>
        </div>

        {canEdit && (
          <Tooltip title="ערוך מבחן">
            <EditIcon
              onClick={() => setTrigger(!trigger)}
              className={style.editIcon}
            />
          </Tooltip>
        )}
      </div>
    );
  }

  /* ---------- GRADING ou SHOW+edit : formulaire de correction ---------- */
  if (
    props.renderFor === "grading" ||
    (props.renderFor === "show" && trigger)
  ) {
    return (
      <FormGrade trigger={trigger} setTrigger={setTrigger} props={props} />
    );
  }

  return null;
};

export default QuestionFooter;
