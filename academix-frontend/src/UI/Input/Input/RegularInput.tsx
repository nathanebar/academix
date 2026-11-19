import React, { forwardRef, ReactElement } from "react";
import { ConfigProvider, Input, InputRef } from "antd";
import he_IL from "antd/locale/he_IL";

type Props = {
  value: string | any;
  setValue?: (value: string) => void;
  width?: string | undefined;
  height?: string | undefined;
  placeholder?: string;
  suffix?: ReactElement;
  borderColor?: string;
  marginRight?: string;
  readonly?: boolean;
  hasError?: boolean;
  borderRadius?: string;
  onEnterclickProps?: (() => void) | any;
  onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void;
  backgroundColor?: string;
  disabled?: boolean;
  style?: React.CSSProperties;
  maxLength?: number;
};

const RegularInput = forwardRef<InputRef, Props>((props, ref) => {
  return (
    <ConfigProvider
      locale={he_IL}
      theme={{
        components: {
          Input: {
            colorBorder:
              props.borderColor && props.hasError
                ? props.borderColor
                : "rgba(244, 241, 235, 1)",
            activeBorderColor: "none",
            hoverBorderColor: "none",
            colorTextPlaceholder: "rgba(94, 99, 102, 0.5)",
          },
        },
      }}
    >
      <Input
        ref={ref}
        readOnly={props.readonly ? props.readonly : false}
        style={{
          color: "rgba(94, 99, 102, 1)",
          borderRadius: props.borderRadius ? props.borderRadius : "40px",
          height: props.height,
          background:
            props.backgroundColor ||
            (props.hasError ? "rgba(255,241,240,1)" : "rgba(244, 241, 235, 1)"),
          width: props.width,
          marginRight: props.marginRight,
          ...props.style,
        }}
        value={props.value}
        onKeyDown={(e: any) => {
          if (e.key === "Enter") {
            props.onEnterclickProps?.();
          }
        }}
        onChange={(e) => {
          props.onChange?.(e);
          props.setValue?.(e.target.value);
        }}
        suffix={props.suffix}
        placeholder={props.placeholder}
        disabled={props.disabled}
        maxLength={props.maxLength}
      />
    </ConfigProvider>
  );
});

export default RegularInput;
