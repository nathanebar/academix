import React from "react";
import style from "./GenericOptionSwitch.module.css";

interface Option {
  id: number;
  label: string;
}

interface GenericOptionSwitchProps {
  SwitchContainerLabelStyle?: React.CSSProperties;
  OptionLabelStyle?: React.CSSProperties;
  options: Option[];
  selectedOption: number;
  setSelectedOption: (option: number) => void;
}

export const GenericOptionSwitch: React.FC<GenericOptionSwitchProps> = ({
  SwitchContainerLabelStyle,
  OptionLabelStyle,
  options,
  selectedOption,
  setSelectedOption,
}) => {
  return (
    <div style={SwitchContainerLabelStyle}>
      {options.map((option) => (
        <span
          style={OptionLabelStyle}
          key={option.id}
          className={
            selectedOption === option.id
              ? `${style.option} ${style.active}`
              : style.option
          }
          onClick={() => setSelectedOption(option.id)}
        >
          {option.label}
        </span>
      ))}
    </div>
  );
};
