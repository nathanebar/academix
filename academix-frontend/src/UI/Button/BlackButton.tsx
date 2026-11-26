/*
 * BlackButton: the app's shared pill button (redesign-prep Epic #97, issue #103).
 *
 * Variants (`variant` prop, optional; omitting it renders exactly as before):
 * - "primary"   (default) dark navy pill, white text.
 * - "secondary" sand pill, grey text (the BGcolor/textColor pair DeleteStudentModal passes today).
 * - "outline"   white pill, black text (the pair NewTaskModal passes today).
 * - "danger"    red pill, white text (antd's danger red).
 * - "dashed"    transparent pill with a dashed navy border, for "add ..." actions.
 * - "icon"      round icon-only button; pass the icon as `icon` or as children, and an `ariaLabel`.
 *
 * Legacy props keep working: `BGcolor`, `textColor`, `fontSize`, `width`, `height` are inline
 * overrides on top of any variant; `focusStyle` keeps its white-on-focus look.
 * `style` is accepted but ignored, as it always was: applying it now would change existing pages.
 * Colors come from src/theme (CSS variables --ax-*), see src/theme/README.md.
 */
import React, { useEffect } from "react";
import { Button } from "antd";
import style from "./blackButton.module.css";

export type BlackButtonVariant =
  | "primary"
  | "secondary"
  | "outline"
  | "danger"
  | "dashed"
  | "icon";

type Props = {
  width: string | undefined;
  height: string | undefined;
  BGcolor?: string;
  fontSize?: string;
  textColor?: string;
  focusStyle?: boolean;
  onclickProps?: () => void;
  style?: React.CSSProperties;
  buttonActive?: any;
  onKeyDownProps?: any;
  /** Visual variant; default "primary" (the historical look). */
  variant?: BlackButtonVariant;
  disabled?: boolean;
  /** Native button type; default "button" (antd's default). */
  htmlType?: "button" | "submit" | "reset";
  /** Icon shown before the label, or alone with variant "icon". */
  icon?: React.ReactNode;
  /** Accessible name, required for an icon-only button. */
  ariaLabel?: string;
  /** Extra class names appended after the variant classes. */
  className?: string;
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

  const variant = props.variant ?? "primary";
  const classes = [
    style["button"],
    variant !== "primary" && style[variant],
    props.focusStyle && style["focusBtn"],
    props.className,
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <Button
      ref={btnRef}
      className={classes}
      onClick={props.onclickProps}
      disabled={props.disabled}
      htmlType={props.htmlType}
      icon={props.icon}
      aria-label={props.ariaLabel}
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
