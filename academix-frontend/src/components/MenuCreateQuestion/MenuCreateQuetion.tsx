import { PlusOutlined, SwapOutlined, UndoOutlined } from "@ant-design/icons";
import { Button, Menu, Tooltip } from "antd";
import React from "react";
import { QuestionType } from "../../types/types";
import style from "./menuCreateQuetion.module.css";

type Props = {
  setIsDraggableQustions: React.Dispatch<React.SetStateAction<boolean>>;
  setQuestionsForEdit: React.Dispatch<
    React.SetStateAction<{ questions: QuestionType[] }>
  >;
  RefreshQuestions: () => void;
  onAddQuestion: () => void; // ✅ nouvelle prop
};

const MenuCreateQuetion = (props: Props) => {
  return (
    <Menu
      className={style["menu"]}
      mode="vertical"
      items={[
        {
          style: { display: "flex", justifyContent: "center" },
          onClick: props.onAddQuestion, // ✅ ajoute + scroll (via le parent)
          icon: (
            <Tooltip title="הוספת שאלה">
              <Button className={style["button"]}>
                <PlusOutlined />
              </Button>
            </Tooltip>
          ),
          key: "add",
        },
        {
          style: {
            display: "flex",
            justifyContent: "center",
            textAlign: "center",
          },
          onClick: () => {
            props.setIsDraggableQustions((prevState) => !prevState);
          },
          className: style["item"],
          icon: (
            <Tooltip title="שינוי סדר השאלות">
              <Button className={style["button"]}>
                <SwapOutlined rotate={90} />
              </Button>
            </Tooltip>
          ),
          key: "reorder",
        },
        {
          style: { display: "flex", justifyContent: "center" },
          onClick: () => {
            props.RefreshQuestions();
          },
          className: style["item"],
          icon: (
            <Tooltip title="איפוס השאלה">
              <Button className={style["button"]}>
                <UndoOutlined />
              </Button>
            </Tooltip>
          ),
          key: "reset",
        },
      ]}
    />
  );
};

export default MenuCreateQuetion;
