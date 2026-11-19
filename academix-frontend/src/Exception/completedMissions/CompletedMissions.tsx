import React, { useEffect, useState } from "react";
import style from "./CompletedMissions.module.css";
import {
    COLORS,
  getOpenFeedbackByTeam,
  getTasksByTeam,
  getTeamCompletedTasks,
} from "../../services/ApiServices";
import ChartBar from "../CertificationSteps/ChartBar/ChartBar";
import { useLocation } from "react-router-dom";
import { useSelectionsStore } from "../../store/selectionStore";

type Mode = "oincidence" | "soldier";
type Props = {
  teamId?: Number;
  assignmemtData:any
};

const CompletedMissions = (props: Props) => {
  const [mode, setMode] = useState<Mode>("soldier");

  const location = useLocation();
  const currentUrl = location.pathname;

  return (
    <div
      className={style["container"]}
      style={
        currentUrl === "/dashboard/team"
          ? { width: "40%", height: "23vh" }
          : {}
      }
    >
      <div className={style["headerDiv"]}>
        <div>
          <h3 style={{ color: "#6E7072", fontSize: "20px", margin: 0 }}>
            {mode === "soldier" ? "חניך" : "חופף"}
          </h3>
            <span style={{color:'silver'}}>(מספר משימות שבוצעו)</span>
        </div>

        <div>
          <div className={style["imporveDiv"]}>
            <div
              onClick={() => setMode("oincidence")}
              className={style["imporveText"]}
              style={{
                backgroundColor: mode === "oincidence" ? "white" : "",
                color: mode !== "oincidence" ? "white" : "",
              }}
            >
              חופף
            </div>
            <div
              onClick={() => setMode("soldier")}
              className={style["imporveText"]}
              style={{
                backgroundColor: mode === "soldier" ? "white" : "",
                color: mode !== "soldier" ? "white" : "",
              }}
            >
              חניך
            </div>
          </div>
        </div>
      </div>
      {mode === "soldier" && (
        <div className={style["chartsContainer"]}>
          {/* <div className={style.teams}></div> */}
          <div className={style.chartWrapper}>
            <ChartBar assignmemtData={props.assignmemtData} />
          </div>
        </div>
      )}
    </div>
  );
};
export default CompletedMissions;
