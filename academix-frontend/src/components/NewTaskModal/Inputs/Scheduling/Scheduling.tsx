import React, { useState } from "react";
import style from "./Scheduling.module.css";
import { ClockCircleOutlined } from "@ant-design/icons";

interface SchedulingProps {
  startMinutesBefore?: number | null;
  endMinutesAfter?: number | null;
  onStartChange: (value: number | null) => void;
  onEndChange: (value: number | null) => void;
  enabled?: boolean;
  onEnabledChange: (value: boolean) => void;
  locked?: boolean | undefined;
}

const Scheduling: React.FC<SchedulingProps> = ({
  startMinutesBefore,
  endMinutesAfter,
  onStartChange,
  onEndChange,
  enabled,
  onEnabledChange,
  locked,
}) => {
  const [openStart, setOpenStart] = useState(false);
  const [openEnd, setOpenEnd] = useState(false);

  const minuteOptions = Array.from({ length: 25 }, (_, i) => ({
    value: i * 5,
    label: `${i * 5} דקות`,
  }));

  const formatStartLabel = (value: number | null | undefined) => {
    if (!value || value === 0) return "";
    return `${value} דק לפני`;
  };

  const formatEndLabel = (value: number | null | undefined) => {
    if (!value || value === 0) return "";
    return `${value} דק אחרי`;
  };

  return (
    <div className={style.wrapper}>
      <div className={style.row}>
        <div className={style.title}>
          <span>תזמון</span>
        </div>

        {enabled && (
          <>
            <div className={style.dropdownContainer}>
              <div className={style.dropdownWrapper}>
                <button
                  className={style.dropdownButton}
                  style={{ cursor: locked ? "not-allowed" : "pointer" }}
                  onClick={() => {
                    setOpenStart(!openStart);
                    setOpenEnd(false);
                  }}
                  disabled={locked}
                >
                  <span className={style.buttonText}>פתיחה</span>
                  <span
                    className={`${style.arrowIcon} ${
                      openStart ? style.arrowOpen : ""
                    }`}
                  >
                    ▼
                  </span>
                </button>

                {openStart && (
                  <div className={style.dropdownMenu}>
                    {minuteOptions.map((option) => (
                      <div
                        key={option.value}
                        className={style.dropdownItem}
                        onClick={() => {
                          onStartChange(option.value);
                          setOpenStart(false);
                        }}
                      >
                        {option.label}
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <span className={style.selectedValue}>
                {formatStartLabel(startMinutesBefore)}
              </span>
            </div>
            <div className={style.dropdownContainer}>
              <div className={style.dropdownWrapper}>
                <button
                  className={style.dropdownButton}
                  style={{ cursor: locked ? "not-allowed" : "pointer" }}
                  onClick={() => {
                    setOpenEnd(!openEnd);
                    setOpenStart(false);
                  }}
                  disabled={locked}
                >
                  <span className={style.buttonText}>סגירה</span>
                  <span
                    className={`${style.arrowIcon} ${
                      openEnd ? style.arrowOpen : ""
                    }`}
                  >
                    ▼
                  </span>
                </button>

                {openEnd && (
                  <div className={style.dropdownMenu}>
                    {minuteOptions.map((option) => (
                      <div
                        key={option.value}
                        className={style.dropdownItem}
                        onClick={() => {
                          onEndChange(option.value);
                          setOpenEnd(false);
                        }}
                      >
                        {option.label}
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <span className={style.selectedValue}>
                {formatEndLabel(endMinutesAfter)}
              </span>
            </div>
          </>
        )}

        <ClockCircleOutlined className={style.clockIcon} />
      </div>
    </div>
  );
};

export default Scheduling;
