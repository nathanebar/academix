// src/components/Modals/EditTemplateAxis/TemplateItem.tsx
import React from "react";
import { Button } from "antd";
import style from "./editTemplateAxisModal.module.css";
import { AxisTemplate } from "../../../types/types";

type Props = {
  isSelected: boolean;
  Icon: React.ReactElement;
  title: string;
  /** שם השדה במודל (files, checklist, …) */
  itemKey: keyof AxisTemplate;
  setItems: any;
};

const TemplateItem: React.FC<Props> = ({
  isSelected,
  Icon,
  title,
  itemKey,
  setItems,
}) => {
  const toggle = () => {
    setItems((prev:any) => ({
      ...prev,
      [itemKey]: !prev[itemKey],
    }));
  };

  return (
    <Button
      onClick={toggle}
      className={style["template-item"]}
      style={{
        backgroundColor: isSelected ? "rgb(232, 225, 211)" : "white",
      }}
    >
      <div>{title}</div>
      {Icon}
    </Button>
  );
};

export default TemplateItem;