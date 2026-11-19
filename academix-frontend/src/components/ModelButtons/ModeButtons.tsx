// ModeButtons.tsx
import React from "react";
import style from "./ModeButtons.module.css";
import { viewMode } from "../../types/types";

interface ModeButtonsProps {
  viewMode: string;
  onModeChange: (view: viewMode) => void;
}

const ModeButtons: React.FC<ModeButtonsProps> = ({
  viewMode,
  onModeChange,
}) => {
  return (
    <div className={style.modeButtonsContainer}>
      <button
        onClick={() => onModeChange("dayGridMonth")}
        className={`${style.modeButton} ${
          viewMode === "dayGridMonth" ? style.activeModeButton : ""
        }`}
      >
        חודש
      </button>
      <button
        onClick={() => onModeChange("twoWeeks")}
        className={`${style.modeButton} ${
          viewMode === "twoWeeks" ? style.activeModeButton : ""
        }`}
      >
        שבועיים
      </button>
      <button
        onClick={() => onModeChange("timeGridWeek")}
        className={`${style.modeButton} ${
          viewMode === "timeGridWeek" ? style.activeModeButton : ""
        }`}
      >
        שבוע
      </button>

      <button
        onClick={() => onModeChange("timeGridDay")}
        className={`${style.modeButton} ${
          viewMode === "timeGridDay" ? style.activeModeButton : ""
        }`}
      >
        יום
      </button>
    </div>
  );
};

export default ModeButtons;