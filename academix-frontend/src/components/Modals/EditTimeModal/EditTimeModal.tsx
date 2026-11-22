import React, { useState, useEffect } from "react";
import { Button, Select } from "antd";
import GenericModal from "../GenericModal";
import style from "./EditTimeModal.module.css";
import BlackButton from "../../../UI/Button/BlackButton";
import { updateToUser } from "../../../services/ApiServices";
import Notification from "../../../UI/Notification/Notification";
import { useQueryClient } from "@tanstack/react-query";

type EditTimeModalProps = {
  isOpen: boolean;
  setIsOpen: (open: boolean) => void;
  timeText: string; // Format: "9:30 - 10:30"
  user_id: number;
};

interface TimeSelectProps {
  value?: string;
  onChange?: (value: string) => void;
  disabledBefore?: string; // ✅ Add this prop
}

const EditTimeModal: React.FC<EditTimeModalProps> = ({
  isOpen,
  setIsOpen,
  timeText,
  user_id,
}) => {
  const { Option } = Select;
  const queryClient = useQueryClient();
  const [startTime, setStartTime] = useState<string>("");
  const [endTime, setEndTime] = useState<string>("");

  const formatTime = (time: string): string => {
    if (!time) return "";
    const [h, m] = time.split(":");
    return `${h.padStart(2, "0")}:${m.padStart(2, "0")}`;
  };

  useEffect(() => {
    if (timeText) {
      const parts = timeText.split(" - ");
      if (parts.length === 2) {
        setStartTime(formatTime(parts[0].trim()));
        setEndTime(formatTime(parts[1].trim()));
      }
    }
  }, [timeText]);

  const handleClick = async () => {
    const parseTime = (timeStr: string): Date | any => {
      const [hours, minutes] = timeStr.split(":").map(Number);
      const date = new Date();
      date.setHours(hours, minutes, 0, 0);
      return date;
    };

    if (startTime > endTime) {
      Notification({ type: "error", msg: "נא בחר זמנים תקינים!" });
      return;
    }

    const res = await updateToUser(
      user_id,
      parseTime(startTime),
      parseTime(endTime)
    );

    if (res.status === 200) {
      setIsOpen(false);
      Notification({ type: "success", msg: "שינוי הזמנים בוצע בהצלחה!" });
      queryClient.invalidateQueries({
        queryKey: ["tasks-day"],
      });
      queryClient.invalidateQueries({
        queryKey: ["task-users"],
      });
    }
  };

  const generateTimeOptions = (): string[] => {
    const times: string[] = [];
    for (let h = 9; h <= 22; h++) {
      for (let m = 0; m < 60; m += 15) {
        if (h === 22 && m > 0) break;
        const hour = h.toString().padStart(2, "0");
        const minute = m.toString().padStart(2, "0");
        times.push(`${hour}:${minute}`);
      }
    }
    return times;
  };

  // ✅ Updated TimeSelect with disabledBefore prop
  const TimeSelect: React.FC<TimeSelectProps> = ({
    value,
    onChange,
    disabledBefore,
  }) => {
    const times = generateTimeOptions();

    return (
      <Select
        value={value}
        onChange={onChange}
        placeholder="בחר/י שעה"
        style={{ width: "100%", height: "3vh", cursor: "pointer" }}
        showSearch
        filterOption={(input, option) =>
          (option?.children as unknown as string)
            .toLowerCase()
            .includes(input.toLowerCase())
        }
      >
        {times.map((t) => (
          <Option
            key={t}
            value={t}
            disabled={disabledBefore ? t < disabledBefore : false}
          >
            {t}
          </Option>
        ))}
      </Select>
    );
  };

  return (
    <GenericModal
      isOpen={isOpen}
      setIsOpen={setIsOpen}
      width="35vw"
      title="שינוי שעות המשימה"
    >
      <div className={style.mainDiv}>
        <div className={style.datesDiv}>
          <div className={style.start}>
            <span style={{ fontWeight: 800 }}>שעת התחלה</span>
            <TimeSelect
              value={startTime}
              onChange={(value) => setStartTime(value)}
            />
          </div>
          <div className={style.end}>
            <span style={{ fontWeight: 800 }}>שעת סיום</span>
            <TimeSelect
              value={endTime}
              onChange={(value) => setEndTime(value)}
              disabledBefore={startTime} // ✅ Pass startTime to disable earlier times
            />
          </div>
        </div>
        <br />
        <div className={style.buttonsDiv}>
          <Button
            onClick={() => setIsOpen(false)}
            style={{ width: "5vw", height: "4vh", borderRadius: "50px" }}
          >
            בטל{" "}
          </Button>
          <BlackButton onclickProps={handleClick} width="5vw" height="4vh">
            שמור שינויים
          </BlackButton>
        </div>
      </div>
    </GenericModal>
  );
};

export default EditTimeModal;
