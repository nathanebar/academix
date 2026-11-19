// CalendarHeader.tsx
import React from "react";
import { Button, Space } from "antd";
import dayjs from "dayjs";
import style from "./CalendarHeader.module.css";
import ModeButtons from "../ModelButtons/ModeButtons";
import {
  CalendarOutlined,
  CaretLeftOutlined,
  CaretRightOutlined,
  PlusOutlined,
  UnorderedListOutlined,
} from "@ant-design/icons";
import { viewMode } from "../../types/types";

interface CalendarHeaderProps {
  onPrev: () => void;
  onNext: () => void;
  onToday: () => void;
  onChangeView: (view: viewMode) => void;
  activeViewMode: string;
  currentDate: dayjs.Dayjs;
   displayMode: "full" | "split";     
  setDisplayMode: (mode: "full" | "split") => void; 
}

const CalendarHeader: React.FC<CalendarHeaderProps> = ({
  onPrev,
  onNext,
  onToday,
  onChangeView,
  activeViewMode,
  currentDate,
  displayMode,        // ✅ נוסף
  setDisplayMode, 
}) => {
  
  const hebrewMonths = [
    "ינואר",
    "פברואר",
    "מרץ",
    "אפריל",
    "מאי",
    "יוני",
    "יולי",
    "אוגוסט",
    "ספטמבר",
    "אוקטובר",
    "נובמבר",
    "דצמבר",
  ];

  const hebrewDays = ["ראשון", "שני", "שלישי", "רביעי", "חמישי", "שישי", "שבת"];

  const formatDate = () => {
      let displayDate = currentDate;

    if (activeViewMode === "dayGridMonth") {
      displayDate = currentDate.add(5, "days");
      
    }
    switch (activeViewMode) {
      case "dayGridMonth":
      return `${hebrewMonths[displayDate.month()]} ${displayDate.year()}`;

      case "timeGridWeek":
        const startOfWeek = currentDate.startOf("week");
        const endOfWeek = currentDate.endOf("week");
        return `${startOfWeek.format("DD/MM/YYYY")} - ${endOfWeek.format(
          "DD/MM/YYYY"
        )}`;

      case "twoWeeks":
        const startOfTwoWeeks = currentDate.startOf("week");
        const endOfTwoWeeks = currentDate.add(1, "week").endOf("week");
        return `${startOfTwoWeeks.format(
          "DD/MM/YYYY"
        )} - ${endOfTwoWeeks.format("DD/MM/YYYY")}`;

      case "timeGridDay":
        const dayName = hebrewDays[currentDate.day()];
        return `${dayName} ${currentDate.format("DD/MM/YYYY")}`;

      default:
        return currentDate.format("DD/MM/YYYY");
    }
  };

  return (
    <div className={style.headerContainer}>

      

      <div className={style.buttonContainer}>
        <ModeButtons viewMode={activeViewMode} onModeChange={onChangeView} />
    {/*     <Button className={style.newTask} onClick={onToday}>
          היום
        </Button> */}
        {/* <Button className={style.newTask}>
          <PlusOutlined /> סטטוס משימות
        </Button> */}
      </div>


         <div className={style.viewToggle}>
        <button
          className={`${style.toggleBtn} ${
            displayMode === "full" ? style.active : ""
          }`}
          onClick={() => setDisplayMode("full")}
        >
          <CalendarOutlined />
          לוח שנה
        </button>
        <button
          className={`${style.toggleBtn} ${
            displayMode === "split" ? style.active : ""
          }`}
          onClick={() => setDisplayMode("split")}
        >
          <UnorderedListOutlined />
          תצוגת תור משימות ולוח שנה
        </button>
      </div>
      
      <Space>
        <Button onClick={onPrev} className={style.navButton}>
          {<CaretRightOutlined/>}
        </Button>
        <div style={{ minWidth: "8vw",fontSize:12,fontWeight:"500" }}>
          <span className={style.monthYearText}>{formatDate()}</span>
        </div>
        <Button onClick={onNext} className={style.navButton}>
          {<CaretLeftOutlined />}
        </Button>
      </Space>
    </div>
  );
};

export default CalendarHeader;
