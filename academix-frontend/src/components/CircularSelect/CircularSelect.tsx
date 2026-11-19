import React from "react";
import { ConfigProvider, Select } from "antd";
import style from "./circularSelect.module.css";

const { Option } = Select;

interface CircularSelectProps {
  options: { value: string; label: string }[];
  defaultValue?: string;
  onChange?: (value: string) => void;
  width?: number;
  size?: 'small' | 'middle' | 'large';
}

const CircularSelect = ({ 
  options, 
  defaultValue = "option1", 
  onChange,
  width = 105,
  size = "middle"
}: CircularSelectProps) => {
  return (
    <ConfigProvider
      theme={{
        components: {
          Select: {
            borderRadius: 100,
            fontSize: 12,
            controlHeight: 40
          },
        },
      }}
    >
      <Select
        style={{ width }}
        defaultValue={defaultValue}
        onChange={onChange}
        size={size}
      >
        {options.map((option) => (
          <Option 
            key={option.value} 
            value={option.value}
            className={style["circular-select"]}
          >
            {option.label}
          </Option>
        ))}
      </Select>
    </ConfigProvider>
  );
};

export default CircularSelect;