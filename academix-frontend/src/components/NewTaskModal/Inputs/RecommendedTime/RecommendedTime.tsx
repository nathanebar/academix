import { Select, Tooltip } from "antd";
import style from "./RecommendedTime.module.css";
import React, { useState, useEffect } from "react";
import { useTaskStore } from "../../../../store/taskStore";
import { ClockCircleOutlined } from "@ant-design/icons";

interface TimeState {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
}
interface props {
  recommendedTime?: number | null;
  setIsChange: any;
  locked?: boolean | undefined;
}

const RecommendedTime = ({ recommendedTime, setIsChange, locked }: props) => {
  const taskInStore = useTaskStore((state) => state.task);
  const setTaskInStore = useTaskStore((state) => state.addTask);

  const [time, setTime] = useState<TimeState>({
    days: 0,
    hours: 0,
    minutes: 0,
    seconds: 0,
  });

  useEffect(() => {
    setTaskInStore({
      ...taskInStore,
      recommendedTime: time.days * 24 * 60 + time.hours * 60 + time.minutes,
    });
  }, [time]);

  useEffect(() => {
    if (recommendedTime !== undefined && recommendedTime !== null) {
      const totalMinutes = recommendedTime;
      const days = Math.floor(totalMinutes / (24 * 60));
      const remainingAfterDays = totalMinutes % (24 * 60);
      const hours = Math.floor(remainingAfterDays / 60);
      const minutes = remainingAfterDays % 60;

      setTime({ days, hours, minutes, seconds: 0 });
    }
  }, [recommendedTime]);

  const formatTimeDisplay = () => {
    const { days, hours, minutes } = time;

    const parts: string[] = [];

    if (days > 0) {
      parts.push(`${days} ${days === 1 ? "יום" : "ימים"}`);
    }
    if (hours > 0) {
      parts.push(`${hours} ${hours === 1 ? "שעה" : "שעות"}`);
    }
    if (minutes > 0) {
      parts.push(`${minutes} ${minutes === 1 ? "דקה" : "דקות"}`);
    }

    if (parts.length === 0) {
      return "לא הוזן זמן";
    }

    return parts.join(" ו-");
  };

  const handleDaysClear = () => {
    setTime((prev) => ({ ...prev, days: 0 }));
    setIsChange(true);
  };

  const handleHoursClear = () => {
    setTime((prev) => ({ ...prev, hours: 0 }));
    setIsChange(true);
  };

  const handleMinutesClear = () => {
    setTime((prev) => ({ ...prev, minutes: 0 }));
    setIsChange(true);
  };

  const handleDaysChange = (value: number | null) => {
    if (value === null) {
      handleDaysClear();
      return;
    }
    setTime((prev) => ({ ...prev, days: value }));
    setIsChange(true);
  };

  const handleHoursChange = (value: number | null) => {
    if (value === null) {
      handleHoursClear();
      return;
    }
    setTime((prev) => ({ ...prev, hours: value }));
    setIsChange(true);
  };

  const handleMinutesChange = (value: number | null) => {
    if (value === null) {
      handleMinutesClear();
      return;
    }
    setTime((prev) => ({ ...prev, minutes: value }));
    setIsChange(true);
  };

  return (
    <div className={style.wrapper}>
      <div className={style.right}>
        <Tooltip title="המלצת זמן משוער שהתרגיל אמור לקחת, הזמן האמיתי יגזר משיבוץ המשימה בפועל בלוח השנה">
          <div className={style.header}>משך זמן (מומלץ)</div>
        </Tooltip>

        <div className={style.timeDisplay}>{formatTimeDisplay()}</div>
      </div>

      <div className={style.left}>
        <Tooltip title="הוספת דקות (1-60)">
          <Select
            className={style.btn}
            disabled={locked}
            placeholder="דקות"
            style={{ width: 100 }}
            value={time.minutes > 0 ? time.minutes : undefined}
            allowClear
            showSearch
            filterOption={(input, option) =>
              String(option?.children)
                .toLowerCase()
                .includes(input.toLowerCase())
            }
            onChange={handleMinutesChange}
            suffixIcon={<ClockCircleOutlined />}
          >
            {Array.from({ length: 60 }, (_, i) => (
              <Select.Option key={i + 1} value={i + 1}>
                {i + 1} דק׳
              </Select.Option>
            ))}
          </Select>
        </Tooltip>

        <Tooltip title="הוספת שעות (1-24)">
          <Select
            className={style.btn}
            disabled={locked}
            placeholder="שעות"
            style={{ width: 100 }}
            value={time.hours > 0 ? time.hours : undefined}
            allowClear
            showSearch
            filterOption={(input, option) =>
              String(option?.children)
                .toLowerCase()
                .includes(input.toLowerCase())
            }
            onChange={handleHoursChange}
            suffixIcon={<ClockCircleOutlined />}
          >
            {Array.from({ length: 24 }, (_, i) => (
              <Select.Option key={i + 1} value={i + 1}>
                {i + 1} שעות
              </Select.Option>
            ))}
          </Select>
        </Tooltip>

        <Tooltip title="הוספת ימים (1-14)">
          <Select
            className={style.btn}
            disabled={locked}
            placeholder="ימים"
            style={{ width: 100 }}
            value={time.days > 0 ? time.days : undefined}
            allowClear
            showSearch
            filterOption={(input, option) =>
              String(option?.children)
                .toLowerCase()
                .includes(input.toLowerCase())
            }
            onChange={handleDaysChange}
            suffixIcon={<ClockCircleOutlined />}
          >
            {Array.from({ length: 14 }, (_, i) => (
              <Select.Option key={i + 1} value={i + 1}>
                {i + 1} {i + 1 === 1 ? "יום" : "ימים"}
              </Select.Option>
            ))}
          </Select>
        </Tooltip>
      </div>
    </div>
  );
};

export default RecommendedTime;
