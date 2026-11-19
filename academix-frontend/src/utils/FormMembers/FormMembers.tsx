import { useMemo } from "react";
import Photo from "../../UI/Photo/Photo";
import style from "./FormMembers.module.css";
type Props = {
  users?: any;
  handleClick: (record: any) => void;
};

type Status = {
  label: string;
  color: string;
  bg: string;
  dot: string;
};

const STATUS_MAP: Record<string, Status> = {
  graded: {
    label: "בוצע והוזן ציון",
    color: "#1f8a70",
    bg: "#e6f7f1",
    dot: "#2ec4a0",
  },
  pending: {
    label: "ממתין לציון",
    color: "#d97a00",
    bg: "#fff4e0",
    dot: "#f5a623",
  },
  notDone: {
    label: "טרם בוצע",
    color: "#6e7072",
    bg: "#ece5d6",
    dot: "#a3a6a8",
  },
};

const getStatus = (score: any, hasSubmission: boolean): Status => {
  const hasScore = score !== null && score !== undefined;
  if (hasSubmission && hasScore) return STATUS_MAP.graded;
  if (hasSubmission) return STATUS_MAP.pending;
  return STATUS_MAP.notDone;
};

const scoreColor = (percent?: number): string => {
  if (percent === undefined || percent === null) return "#a3a6a8";
  if (percent >= 80) return "#1f8a70";
  if (percent >= 65) return "#f5a623";
  return "#e23d2e";
};

const ScoreRing = ({ percent, score }: { percent?: number; score: any }) => {
  const pct = Math.max(0, Math.min(100, percent ?? 0));
  const color = scoreColor(percent);
  const radius = 26;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (circumference * pct) / 100;
  const hasScore = score !== null && score !== undefined;

  return (
    <div
      style={{
        position: "relative",
        width: 64,
        height: 64,
        flexShrink: 0,
      }}
    >
      <svg
        width="64"
        height="64"
        viewBox="0 0 64 64"
        style={{ transform: "rotate(-90deg)" }}
      >
        <circle
          cx="32"
          cy="32"
          r={radius}
          fill="none"
          stroke="#eceff4"
          strokeWidth="6"
        />
        <circle
          cx="32"
          cy="32"
          r={radius}
          fill="none"
          stroke={hasScore ? color : "transparent"}
          strokeWidth="6"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          style={{ transition: "stroke-dashoffset 0.6s ease" }}
        />
      </svg>
      <div
        style={{
          position: "absolute",
          inset: 0,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <span
          style={{
            fontSize: 18,
            fontWeight: 700,
            lineHeight: 1,
            color: hasScore ? color : "#a3a6a8",
          }}
        >
          {hasScore ? Math.round(score * 10) / 10 : "—"}
        </span>
        {hasScore && (
          <span style={{ fontSize: 9, color: "#a3a6a8", marginTop: 2 }}>
            {Math.round(pct)}%
          </span>
        )}
      </div>
    </div>
  );
};

const FormMembers = (props: Props) => {
  const users = props?.users ?? [];

  const header = useMemo(
    () => (
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr auto auto 24px",
          gap: "1rem",
          alignItems: "center",
          padding: "10px 20px",
          color: "#6e7072",
          fontSize: 12,
          fontWeight: 600,
          letterSpacing: 0.3,
          borderBottom: "1px solid #eef0f4",
        }}
      >
        <span>שם מלא</span>
        <span style={{ textAlign: "center", width: 110 }}>סטטוס</span>
        <span style={{ textAlign: "center", width: 64 }}>ציון</span>
        <span />
      </div>
    ),
    []
  );

  const rows = users.map((record: any) => {
    const status = getStatus(record.score, record.hasSubmission);
    const hasScore = record.score !== null && record.score !== undefined;

    return (
      <div
        key={record.id}
        onClick={(e) => {
          props.handleClick(record);
        }}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            props.handleClick(record);
          }
        }}
        style={{
          display: "grid",
          gridTemplateColumns: "1fr auto auto 24px",
          gap: "1rem",
          alignItems: "center",
          padding: "14px 20px",
          cursor: "pointer",
          background: "#ffffff",
          borderBottom: "1px solid #f2f3f7",
          transition:
            "background 0.2s ease, transform 0.2s ease, box-shadow 0.2s ease",
        }}
        className={style["fm-row"]}
      >
        <div style={{ display: "flex", alignItems: "center", minWidth: 0 }}>
          <Photo username={record.username} />
          <div style={{ marginInlineStart: 12, minWidth: 0 }}>
            <div
              style={{
                fontWeight: 700,
                fontSize: 15,
                color: "#1f2330",
                whiteSpace: "nowrap",
                overflow: "hidden",
                textOverflow: "ellipsis",
              }}
            >
              {record.name || "—"}
            </div>
            <div style={{ fontSize: 12, color: "#a3a6a8" }}>
              {record.militaryId ? `מס׳ אישי: ${record.militaryId}` : ""}
            </div>
          </div>
        </div>

        {/* Statut */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            width: 110,
          }}
        >
          <span
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 6,
              padding: "5px 12px",
              borderRadius: 999,
              fontSize: 12,
              fontWeight: 600,
              color: status.color,
              backgroundColor: status.bg,
              whiteSpace: "nowrap",
            }}
          >
            <span
              style={{
                width: 7,
                height: 7,
                borderRadius: "50%",
                backgroundColor: status.dot,
                flexShrink: 0,
              }}
            />
            {status.label}
          </span>
        </div>

        {/* Score */}
        <div style={{ textAlign: "center" }}>
          <ScoreRing percent={record.scorePercentage} score={record.score} />
        </div>
      </div>
    );
  });

  return (
    <div
      dir="rtl"
      style={{
        background: "#fafbfd",
        borderRadius: 16,
        border: "1px solid #eef0f4",
        boxShadow: "0 4px 24px rgba(20, 28, 60, 0.06)",
        overflow: "hidden",
      }}
    >
      {header}
      <div>{rows}</div>
      {users.length === 0 && (
        <div
          style={{
            padding: "40px 20px",
            textAlign: "center",
            color: "#a3a6a8",
            fontSize: 14,
          }}
        >
          אין משתמשים להצגה
        </div>
      )}
    </div>
  );
};

export default FormMembers;
