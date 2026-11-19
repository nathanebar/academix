import React from "react";
import "./Sidebar.css";
import CalendarComponent from "../../CalendarComponent/CalendarComponent";
import { useSelectionsStore } from "../../../store/selectionStore";
import DayCalendar from "./DayCalendar/DayCalendar";
import { useLocation } from "react-router-dom";
import MissionsRepo from "../../MissionsRepo/MissionsRepo";

const Sidebar = () => {
  const location = useLocation();

  const currentUrl = location.pathname;

  const {
    selectedTeam,
    selectedTeamMember,
  } = useSelectionsStore();

  return (
    <aside className="sidebar">
      {currentUrl === "/calendar" ? (
        <MissionsRepo />
      ) : (
        <div>
          {(selectedTeamMember || selectedTeam) && (
            <>
              <h2>גאנט הקורס</h2>
              <CalendarComponent />
              <DayCalendar />
            </>
          )}
        </div>
      )}
    </aside>
  );
};

export default Sidebar;
