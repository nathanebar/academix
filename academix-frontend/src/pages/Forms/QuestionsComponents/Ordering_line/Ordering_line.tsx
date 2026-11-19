// QuestionsComponents/Ordering_line/Ordering_line.tsx
import { useEffect, useRef, useState } from "react";
import { CaretDownOutlined, CaretUpOutlined } from "@ant-design/icons";
import { QuestionProps } from "../../../../types/types";
import style from "./Ordering_line.module.css";
import QuestionFooter from "../../QuestionFooter/QuestionFooter";

type Option = { id: string | number; option_text: string };

const Ordering_line = (props: QuestionProps) => {
  const [order, setOrder] = useState<Option[]>([]);
  const [selectedId, setSelectedId] = useState<string | number | null>(null);
  const [trigger, setTrigger] = useState<boolean>(false);
  const isAnswer = props.renderFor === "answer";
  const lastOptionsKey = useRef<string>("");

  /* ✅ resync : formData (answer) / submission (show-grading), garde anti-loop */
  useEffect(() => {
    const options = props.options || [];
    const key = JSON.stringify(options.map((o: any) => o.id));

    if (isAnswer) {
      const fromFormData = (props.formData || []).find(
        (i: any) => i.form_question_id === props.questionId
      );
      const submittedOrder = fromFormData?.value_text
        ?.split(" ")
        .filter(Boolean);

      if (submittedOrder?.length === options.length) {
        const restored = submittedOrder.map((word: string) =>
          options.find((o: any) => o.option_text === word)
        );
        if (restored.every(Boolean)) {
          setOrder(restored);
          lastOptionsKey.current = key;
          return;
        }
      }

      if (lastOptionsKey.current !== key) {
        setOrder(options);
        lastOptionsKey.current = key;
      }
      return;
    }

    // show / grading
    const submittedOrder = props.submission?.[0]?.value_text
      ?.split(" ")
      .filter(Boolean);
    if (submittedOrder?.length === options.length) {
      const restored = submittedOrder.map((word: string) =>
        options.find((o: any) => o.option_text === word)
      );
      if (restored.every(Boolean)) {
        setOrder(restored);
        lastOptionsKey.current = key;
        return;
      }
    }
    setOrder(options);
    lastOptionsKey.current = key;
  }, [
    JSON.stringify(props.formData),
    JSON.stringify(props.submission),
    JSON.stringify(props.options),
  ]);

  const wordsWithSpace = order.map((o: any) => o.option_text).join(" ");

  /* ✅ sauvegarde à chaque réordonnancement */
  useEffect(() => {
    if (!isAnswer || order.length === 0) return;
    props.setFormData((prev: any) => {
      const prevArr = Array.isArray(prev) ? prev : []; // 🛡
      const idx = prevArr.findIndex(
        (i: any) => i.form_question_id === props.questionId
      );
      if (idx !== -1) {
        const updated = [...prevArr];
        updated[idx] = { ...updated[idx], value_text: wordsWithSpace };
        return updated;
      }
      return [
        ...prevArr,
        { form_question_id: props.questionId, value_text: wordsWithSpace },
      ];
    });
  }, [wordsWithSpace, isAnswer]);

  const handleMoveUp = () => {
    if (selectedId === null || !isAnswer) return;
    setOrder((prev) => {
      const idx = prev.findIndex((o) => o.id === selectedId);
      if (idx <= 0) return prev;
      const next = [...prev];
      [next[idx], next[idx - 1]] = [next[idx - 1], next[idx]];
      return next;
    });
  };

  const handleMoveDown = () => {
    if (selectedId === null || !isAnswer) return;
    setOrder((prev) => {
      const idx = prev.findIndex((o) => o.id === selectedId);
      if (idx === -1 || idx >= prev.length - 1) return prev;
      const next = [...prev];
      [next[idx], next[idx + 1]] = [next[idx + 1], next[idx]];
      return next;
    });
  };

  return (
    <div className={style.card}>
      <div className={style.question}>סדר את המשפטים לפי הסדר הנכון</div>

      <div className={style.list}>
        {order.map((option: any, index: number) => (
          <div
            key={option.id}
            className={`${style.row} ${
              selectedId === option.id && isAnswer ? style.rowSelected : ""
            }`}
            onClick={() => isAnswer && setSelectedId(option.id)}
          >
            {isAnswer && selectedId === option.id && (
              <div className={style.icons}>
                {index !== 0 && (
                  <button
                    type="button"
                    className={style.iconBtn}
                    onClick={(e) => {
                      e.stopPropagation();
                      handleMoveUp();
                    }}
                  >
                    <CaretUpOutlined />
                  </button>
                )}
                {index !== order.length - 1 && (
                  <button
                    type="button"
                    className={style.iconBtn}
                    onClick={(e) => {
                      e.stopPropagation();
                      handleMoveDown();
                    }}
                  >
                    <CaretDownOutlined />
                  </button>
                )}
              </div>
            )}
            <div className={style.sentence}>
              <span className={style.index}>{index + 1}.</span>
              {option?.option_text}
            </div>
          </div>
        ))}
      </div>

      <QuestionFooter props={props} trigger={trigger} setTrigger={setTrigger} />
    </div>
  );
};

export default Ordering_line;
