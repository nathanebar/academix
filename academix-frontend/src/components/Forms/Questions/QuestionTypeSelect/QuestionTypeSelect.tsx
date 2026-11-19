import React from "react";
import { ConfigProvider, Select } from "antd";
import { CaretDownFilled } from "@ant-design/icons";
import headerQuestionStyle from "../questionHeader.module.css";
import style from "./questionTypeSelect.module.css";
import {
  SELECT_OPTIONS,
  SELECT_OPTIONS_FOR_SURVEY,
} from "../../../../utils/getCurrentSelectValue";
import { useLocation } from "react-router-dom";

interface QuestionTypeSelectProps {
  value?: any;
  onChange?: (value: any) => void;
  placeholder?: string;
  className?: string;
}

const QuestionTypeSelect = ({
  value,
  onChange,
  placeholder = "בחר סוג שאלה",
  className = "",
}: QuestionTypeSelectProps) => {
  const location = useLocation();
  const isSurveyPage = location.pathname.includes("/survey");

  const optionData = !isSurveyPage ? SELECT_OPTIONS : SELECT_OPTIONS_FOR_SURVEY;

  return (
    <ConfigProvider
      theme={{
        token: {
          fontWeightStrong: 600,
          wireframe: true,
        },
        components: {
          Select: {
            colorBgContainer: "#fffdf6",
            colorBorder: "#ece8df",
            colorPrimary: "#c77f00",
            borderRadius: 10,
            fontWeightStrong: 600,
          },
        },
      }}
    >
      <Select
        style={{ fontWeight: "bold", width: "100%" }}
        className={`${headerQuestionStyle.select} ${className} ${style["select"]}`}
        value={value}
        placeholder={placeholder}
        onChange={onChange}
        popupMatchSelectWidth={false}
        suffixIcon={
          <CaretDownFilled
            style={{
              fontSize: 12,
              borderRadius: "50%",
              color: "rgba(140,140,141)",
            }}
          />
        }
      >
        {optionData?.map((option) => (
          <Select.Option key={option.value} value={option.value}>
            {option.label}
          </Select.Option>
        ))}
      </Select>
    </ConfigProvider>
  );
};

export default QuestionTypeSelect;
