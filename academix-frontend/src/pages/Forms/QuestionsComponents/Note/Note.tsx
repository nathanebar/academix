import React from "react";
import style from "./Note.module.css";
import { QuestionProps } from "../../../../types/types";

const Note = (props: QuestionProps) => {
  return (
    <div className={style["wrapper"]}>
      <p className={style["text"]}>{props.question}</p>
    </div>
  );
};

export default Note;
