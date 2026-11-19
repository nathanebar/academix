import React from "react";
import dayjs from "dayjs";
import style from "./FormStatusTag.module.css";
import {
  CheckCircleOutlined,
  ClockCircleOutlined,
  LoadingOutlined,
  ExclamationCircleOutlined,
} from "@ant-design/icons";

type Props = {
  form: any;
};

const getFormStatus = (form: any) => {
  const hasScore =
    form.scorePercentage != null || form.form_score != null || form.score != null;
  const submitted = form.form_completed_at || form.completed_at;
  const started = form.form_started_at || form.started_at;
  const end = form.end || form.assignAt;

  // 1️⃣ יש ציון → הוגש + נוקד
  if (hasScore) return "scored";

  // 2️⃣ הוגש אבל אין ציון → ממתין לבדיקה
  if (submitted) return "pending";

  // 3️⃣ התחיל אבל לא הגיש → בתהליך (או חריגת זמן)
  if (started) {
    const isLate = end ? new Date(end).getTime() < Date.now() : false;
    return isLate ? "late" : "inProgress";
  }

  // 4️⃣ לא התחיל → נשלח אליו (חובה) / לא בוצע
  return "notDone";
};

const CONFIG = {
  scored: {
    label: "נבחן",
    icon: <CheckCircleOutlined />,
  },
  pending: {
    label: "ממתין לציון",
    icon: <ClockCircleOutlined />,
  },
  inProgress: {
    label: "בתהליך",
    icon: <LoadingOutlined />,
  },
  late: {
    label: "חריגה",
    icon: <ExclamationCircleOutlined />,
  },
  notDone: {
    label: "לא בוצע",
    icon: <ExclamationCircleOutlined />,
  },
} as const;

const FormStatusTag = ({ form }: Props) => {
  const status = getFormStatus(form);
  const cfg = CONFIG[status];

  // במצב "נבחן" — מציג גם את הציון
  const withScore = status === "scored";
  const percent =
    form.scorePercentage ?? form.form_score ?? form.score ?? undefined;
  const displayScore = withScore && percent != null ? Math.floor(Number(percent)) : null;

  return (
    <span className={`${style.tag} ${style[status]}`}>
      {cfg.icon}
      <span>{displayScore != null ? ` הושלם עם ציון : ${displayScore}` : cfg.label}</span>
    </span>
  );
};

export default FormStatusTag;