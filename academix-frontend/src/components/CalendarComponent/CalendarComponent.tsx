import { Calendar, ConfigProvider } from "antd";
import React, { useState } from "react";
import style from "./CalendarComponent.module.css";
import moment from "moment";
import dayjs from "dayjs";
import he_IL from "antd/locale/he_IL";
import "dayjs/locale/he";
import { dateFnsLocalizer } from "react-big-calendar";
import parse from "date-fns/parse";
import startOfWeek from "date-fns/startOfWeek";
import getDay from "date-fns/getDay";
import { format } from "date-fns";
import enUS from "date-fns/locale/he";
import { CaretLeftOutlined, CaretRightOutlined } from "@ant-design/icons";
import { useSelectionsStore } from "../../store/selectionStore";

dayjs.locale("he");

type Props = {};

const CalendarComponent = (props: Props) => {
  // const [selectedDate, setSelectedDate] = useState<any>(new Date());
  const [currentMonth, setCurrentMonth] = useState(dayjs());

  const { selectedDate, setSelectedDate } = useSelectionsStore();

  const handlePrevMonth = () => {
    setCurrentMonth(currentMonth.subtract(1, "month"));
  };

  const handleNextMonth = () => {
    setCurrentMonth(currentMonth.add(1, "month"));
  };

  function onPanelChange(value: any, mode: any) {}

  const locales = {
    he: enUS,
  };
  const localizer = dateFnsLocalizer({
    format,
    parse,
    startOfWeek,
    getDay,
    locales,
  });
  return (
    <div className={style["site-calendar-demo-card"]}>
      <div style={{ display: "flex" }} className={style["header-calendar"]}>
        <h3 style={{ margin: "0", textAlign: "center" }}>
          {currentMonth.format("MMMM YYYY")}
        </h3>

        <div style={{ display: "flex", gap: 10 }}>
          <div
            onClick={handlePrevMonth}
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              width: 32,
              height: 32,
              borderRadius: 8,
              cursor: "pointer",
              color: "#64748b",
              transition: "all 0.2s ease",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = "#f1f5f9";
              e.currentTarget.style.color = "#334155";
              e.currentTarget.style.transform = "scale(1.1)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = "transparent";
              e.currentTarget.style.color = "#64748b";
              e.currentTarget.style.transform = "scale(1)";
            }}
          >
            <CaretRightOutlined />
          </div>

          <div
            onClick={handleNextMonth}
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              width: 32,
              height: 32,
              borderRadius: 8,
              cursor: "pointer",
              color: "#64748b",
              transition: "all 0.2s ease",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = "#f1f5f9";
              e.currentTarget.style.color = "#334155";
              e.currentTarget.style.transform = "scale(1.1)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = "transparent";
              e.currentTarget.style.color = "#64748b";
              e.currentTarget.style.transform = "scale(1)";
            }}
          >
            <CaretLeftOutlined />
          </div>
        </div>
      </div>
      <ConfigProvider
        locale={he_IL}
        theme={{
          components: {
            Calendar: {},
          },
        }}
      >
        <Calendar
          fullscreen={false}
          onPanelChange={onPanelChange}
          headerRender={() => null}
          value={currentMonth}
          fullCellRender={(date) => {
            const today = dayjs();
            const isToday = date.isSame(today, "day");
            const isSelected = selectedDate && date.isSame(selectedDate, "day");
            const isPastDate = date.isBefore(today, "day");

            let bgColor = " #E5DAC3";
            let color = "black";
            let border = "none";
            // let borderColor = 'none'
            if (isPastDate) {
              bgColor = "#F4F1EB ";
            }
            if (isToday) {
              // bgColor = "rgb(190, 174, 139)";
              border = "1.5px solid #ff7272";
            }
            if (isSelected) {
              bgColor = "#2B2F3E"; // Green for selected date
              color = "white";
            }

            const darkenColor = (color: string, percent: number): string => {
              if (!color || color === "transparent") return color;

              // Handle hex colors
              if (color.startsWith("#")) {
                const num = parseInt(color.replace("#", ""), 16);
                const r = Math.max(0, (num >> 16) - percent * 2);
                const g = Math.max(0, ((num >> 8) & 0x00ff) - percent * 2);
                const b = Math.max(0, (num & 0x0000ff) - percent * 2);
                return `#${((r << 16) | (g << 8) | b)
                  .toString(16)
                  .padStart(6, "0")}`;
              }

              return color;
            };

            return (
              <div
                style={{
                  height: "100%",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  backgroundColor: bgColor,
                  color: color,
                  borderRadius: "4px",
                  cursor: "pointer",
                  transition: "background-color 0.2s ease",
                  position: "relative",
                  margin: "2px",
                  border: border,
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = darkenColor(
                    bgColor,
                    10
                  );
                  e.currentTarget.style.transform = "scale(1.05)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = bgColor;
                  e.currentTarget.style.transform = "scale(1)";
                }}
                onClick={() => {
                  setSelectedDate(date);
                }}
              >
                {date.date()}
              </div>
            );
          }}
        />
      </ConfigProvider>
    </div>
  );
};

export default CalendarComponent;
