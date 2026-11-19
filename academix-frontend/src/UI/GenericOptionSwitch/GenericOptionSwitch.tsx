import React from "react";
import styled from "styled-components";

// const SwitchContainer = styled.div`
//   display: flex;
//   align-items: center;
//   gap: 8px;
//   padding: 4px;
//   background-color: #bfac8b;
//   border-radius: 20px;
//   width: fit-content;
// `;

const OptionLabel = styled.span<{ $active: boolean }>`
  background-color: ${(props) => (props.$active ? "white" : "none")};
  color: ${(props) => (props.$active ? "black" : "white")};
  // padding: 4px 52px;
  // border-radius: 16px;
  // font-size: 14px;
  // cursor: pointer;
  // transition: all 0.2s ease;
`;

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
        <OptionLabel
          style={OptionLabelStyle}
          key={option.id}
          $active={selectedOption === option.id}
          onClick={() => setSelectedOption(option.id)}
        >
          {option.label}
        </OptionLabel>
      ))}
    </div>
  );
};
