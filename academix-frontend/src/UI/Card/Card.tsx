import React from "react";
import { Card } from "antd";
import style from "./card.module.css";
type Props = {
  width: string | undefined;
  height: string | undefined;
  bodyStyle?: React.CSSProperties;
  style?: React.CSSProperties;
  title: React.ReactNode;
};

function CardUI(props: React.PropsWithChildren<Props>) {
  return (
    <Card
      styles={{ header: { borderBottom: "none" }, body: props.bodyStyle }}
      className={style["container"]}
      style={{ width: props.width, height: props.height, ...props.style }}
      title={<div className={style["title"]}>{props.title}</div>}
    >
      {props.children}
    </Card>
  );
}

export default CardUI;
