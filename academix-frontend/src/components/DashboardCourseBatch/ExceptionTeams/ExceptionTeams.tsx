/*  ExceptionTeams.tsx  */
import React from "react";
import {
  RocketOutlined,
  CheckCircleOutlined,
  UnorderedListOutlined,
  ClockCircleOutlined,
  SafetyCertificateOutlined,
} from "@ant-design/icons";
import style from "./ExceptionTeams.module.css";

/* ---------- טיפוסי הנתונים ---------- */
type TeamProgress = {
  id: number;
  name: string;
  tasksAssigned: number;
  totalTasks: number;
  completedTasks: number;
  approvedTasks: number;
  stage: string;
  totalStages: number;
};

type Props = {
 isTeam?:boolean;
 teamId?:number;
  teams?: any[];      // נתונים שמגיעים מה‑API
};

/* ---------- קבועי צבעים ---------- */
const teamColors = [
  "#ef4444", "#f97316", "#f59e0b", "#84cc16", "#10b981",
  "#06b6d4", "#3b82f6", "#8b5cf6", "#ec4899", "#6366f1",
];

/* ---------- המרות בטוחות ---------- */
const toNum = (v: any): number => {
  const n = Number(v);
  return Number.isNaN(n) ? 0 : n;
};

const transformTeams = (raw: any[]): TeamProgress[] =>
  raw.map((t, i) => ({
    id: toNum(t.id) || Date.now() + i,
    name: t.name ?? "צוות ללא שם",
    tasksAssigned: toNum(t.tasksAssigned),
    totalTasks:    toNum(t.totalTasks),
    completedTasks: toNum(t.completedTasks),
    approvedTasks:  toNum(t.approvedTasks),
    stage: t.stage ?? "",
    totalStages: toNum(t.totalStages) || 1,
  }));

/* ---------- קומפוננטה ---------- */
const ExceptionTeams = ({ teams = [], isTeam , teamId}: Props) => {


  // const teamsToShow = teams.length > 0 ? transformTeams(teams) : [];
const teamsToShow = teamId
  ? teams.length > 0
    ? transformTeams(teams).filter(team => team.id === teamId)
    : []
  : teams.length > 0
    ? transformTeams(teams)
    : [];
  
  /* ---------- עזרי צבע והתקדמות ---------- */
  const getTeamColor = (i: number) => teamColors[i % teamColors.length];

  const getProgressGradient = (c: string) =>
    `linear-gradient(90deg, ${c} 0%, ${c}99 100%)`;

  const percent = (done: number, all: number) =>
    all === 0 ? 0 : Math.round((done / all) * 100);

  const getCompletionColor = (p: number) => {
    if (p >= 80) return "#10b981";
    if (p >= 60) return "#3b82f6";
    if (p >= 40) return "#f59e0b";
    return "#ef4444";
  };

  const fmt = (n: number) => (n === 0 ? "‑" : n.toString());

  return (
    <div className={style.exceptionsDiv} style={{height: isTeam ? '22vh': ''}}>
      {/* כותרת */}
      <div className={style.header}>
        {/* <div className={style.headerIcon}>
          <RocketOutlined />
        </div> */}
        <div>
          <h2 className={style.title}>התקדמות צוותים</h2>
          <p className={style.subtitle}>מעקב אחר ההתקדמות של כל צוות</p>
        </div>
      </div>

      {/* רשימת צוותים */}
      <div className={style.exceptionsContent}>
        {teamsToShow.map((team, idx) => {
          const col = getTeamColor(idx);
          const p = percent(team.completedTasks, team.totalTasks);
          const compCol = getCompletionColor(p);

          return (
            <div>

              <h3 style={{ color: col, marginBottom: "0.5rem" }}>{team.name}</h3>
            <div className={style.statsContainer} key={team.id}>

              {/* משימות ששובצו */}
              <div className={style.statItem}>
                <div className={style.statIcon} style={{ color: col }}>
                  <ClockCircleOutlined />
                </div>
                <div className={style.statContent}>
                  <span className={style.statLabel}>משימות ששובצו</span>
                  <span className={style.statValue}>{fmt(team.tasksAssigned)}</span>
                </div>
              </div>

              <div className={style.statDivider} />

              {/* סה״כ משימות */}
              <div className={style.statItem}>
                <div className={style.statIcon} style={{ color: "#6b7280" }}>
                  <UnorderedListOutlined />
                </div>
                <div className={style.statContent}>
                  <span className={style.statLabel}>סה״כ משימות</span>
                  <span className={style.statValue}>{fmt(team.totalTasks)}</span>
                </div>
              </div>

              <div className={style.statDivider} />

              {/* משימות שהושלמו */}
              <div className={style.statItem}>
                <div className={style.statIcon} style={{ color: compCol }}>
                  <CheckCircleOutlined />
                </div>
                <div className={style.statContent}>
                  <span className={style.statLabel}>הושלמו</span>
                  <span className={style.statValue}>{fmt(team.completedTasks)}</span>
                </div>
              </div>

              <div className={style.statDivider} />

              {/* משימות מאושרות */}
              <div className={style.statItem}>
                <div className={style.statIcon} style={{ color: compCol }}>
                  <SafetyCertificateOutlined />
                </div>
                <div className={style.statContent}>
                  <span className={style.statLabel}>מאושרות</span>
                  <span className={style.statValue}>{fmt(team.approvedTasks)}</span>
                </div>
              </div>

              {/* סרגל התקדמות (אופציונלי) */}
              <div className={style.progressBarWrapper}>
                <div
                  className={style.progressBar}
                  style={{
                    background: getProgressGradient(col),
                    width: `${p}%`,
                  }}
                />
                <span className={style.progressPct}>{p}%</span>
              </div>


            </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default ExceptionTeams;