import React, { useCallback, useEffect } from "react";
import { Button, Card } from "antd";
import style from "./blackButton.module.css";
type Props = {
  width: string | undefined;
  height: string | undefined;
  BGcolor?: string;
  fontSize?: string;
  textColor?: string;
  focusStyle?: boolean;
  onclickProps?: () => void;
  style?: React.CSSProperties;
  buttonActive?:any;
  onKeyDownProps?:any
};

function BlackButton(props: React.PropsWithChildren<Props>) {
  const btnRef = React.useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (props.buttonActive === true) {
      btnRef.current?.focus();
    }
  }, [props.buttonActive]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLButtonElement>) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      props.onKeyDownProps?.();
    }
  };
  return (
    <Button
      ref={btnRef}
      className={`${style["button"]} ${props.focusStyle && style["focusBtn"]}`}
      onClick={props.onclickProps}
      style={{
        width: props.width,
        height: props.height,
        backgroundColor: props.BGcolor,
        color: props.textColor,
        fontSize: props.fontSize,
      }}
      onKeyDown={handleKeyDown}
    >
      {props.children}
    </Button>
  );
}

export default BlackButton;
