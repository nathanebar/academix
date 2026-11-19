import { useEffect, useState } from "react";
import { QuestionProps } from "../../../../types/types";
import style from "./MultipleQuestions.module.css";
import QuestionFooter from "../../QuestionFooter/QuestionFooter";

const MultipleQuestions = (props: QuestionProps) => {
  const [trigger, setTrigger] = useState<boolean>(false);
  const isAnswer = props.renderFor === "answer";

  // Tri par orderIndex (croissant) : les options sans orderIndex passent à la fin
  const sortByOrderIndex = (a: any, b: any) =>
    (a.orderIndex ?? Number.POSITIVE_INFINITY) -
    (b.orderIndex ?? Number.POSITIVE_INFINITY);

  const subQuestions =
    props.options
      ?.filter((o: any) => o.side === "right")
      .sort(sortByOrderIndex) || [];

  const pool =
    props.options
      ?.filter((o: any) => o.side === "left")
      .sort(sortByOrderIndex) || [];

  /* ✅ checkedMap resynchronisé depuis formData (answer) / submission (show-grading) */
  const sourceAnswers = isAnswer
    ? props.formData || []
    : props.submission || [];
  const sourceMap: Record<number, number> = {};
  (sourceAnswers || []).forEach((s: any) => {
    if (s.right_option_id && s.left_option_id)
      sourceMap[s.right_option_id] = s.left_option_id;
  });

  const [checkedMap, setCheckedMap] =
    useState<Record<number, number>>(sourceMap);

  useEffect(() => {
    setCheckedMap(sourceMap);
  }, [JSON.stringify(isAnswer ? props.formData : props.submission)]);

  const toggleAnswer = (subId: number, leftId: number) => {
    if (!isAnswer) return;

    setCheckedMap((prev) => {
      const next = { ...prev };
      if (next[subId] === leftId) delete next[subId];
      else next[subId] = leftId;
      return next;
    });

    props.setFormData((prev: any) => {
      const prevArr = Array.isArray(prev) ? prev : [];
      const others = prevArr.filter((i: any) => !(i.right_option_id === subId));
      const already = prevArr.some(
        (i: any) => i.right_option_id === subId && i.left_option_id === leftId
      );
      if (already) return others;
      return [
        ...others,
        {
          form_question_id: props.questionId,
          right_option_id: subId,
          left_option_id: leftId,
        },
      ];
    });
  };

  return (
    <div className={style.card}>
      <div className={style.question}>
        {props.question || "בחר תשובה לכל שאלה"}
      </div>

      <div className={style.tableWrap}>
        <table className={style.table}>
          <thead>
            <tr>
              <th className={style.thQuestion}>שאלות</th>
              {pool.map((p: any) => (
                <th key={p.id} className={style.thOption}>
                  {p.option_text}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {subQuestions.map((sub: any, rowIdx: number) => {
              const checkedLeftId = checkedMap[sub.id];
              return (
                <tr key={sub.id}>
                  <td className={style.tdQuestion}>
                    <span className={style.rowIndex}>{rowIdx + 1}.</span>
                    <span>{sub.option_text}</span>
                  </td>
                  {pool.map((p: any) => {
                    const isChecked = checkedLeftId === p.id;
                    return (
                      <td key={p.id} className={style.tdOption}>
                        <label
                          className={`${style.checkCell} ${
                            isChecked ? style.checkCellSelected : ""
                          }`}
                        >
                          <input
                            type="checkbox"
                            checked={isChecked}
                            disabled={!isAnswer}
                            onChange={() => toggleAnswer(sub.id, p.id)}
                          />
                        </label>
                      </td>
                    );
                  })}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <QuestionFooter props={props} trigger={trigger} setTrigger={setTrigger} />
    </div>
  );
};

export default MultipleQuestions;
