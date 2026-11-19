// src/components/Modals/EditTemplateAxis/EditTemplateAxisModal.tsx
import { Modal, notification } from "antd";
import React, { useEffect, useState } from "react";
import style from "./editTemplateAxisModal.module.css";
import TemplateItem from "./TemplateItem";
import { PaperClipOutlined } from "@ant-design/icons";
import BlackButton from "../../../UI/Button/BlackButton";

import twoIcon from "../../../media/svg/solarlink-outline.svg";
import threeIcon from "../../../media/svg/material-symbols-lightlist-rounded.svg";
import fiveIcon from "../../../media/svg/uitprocess.svg";
import sixIcon from "../../../media/svg/lets-iconstime-light.svg";
import sevenIcon from "../../../media/svg/material-symbols-lightfeedback-outline.svg";
import eightIcon from "../../../media/svg/healthiconsi-exam-qualification-outline.svg";
import nineIcon from "../../../media/svg/lets-iconsquestion-light.svg";

import {
  getTemplateByAxisId,
  createTemplateAxis,
  updateTemplateAxis,
} from "../../../services/ApiServices";
import { AxisTemplate } from "../../../types/types";
import { useAxisTemplate } from "../../../store/AxisTemplateStore";

type Props = {
  open: boolean;
  setOpen: React.Dispatch<React.SetStateAction<boolean>>;
  courseName?: string;
  axisId?: number;
  /** רענון של כל הטמפלייטים אחרי שינוי (ב‑store) */
  fetchAxisTemplates: () => void;
};

const EditTemplateAxisModal: React.FC<Props> = ({
  open,
  setOpen,
  courseName,
  axisId,
  fetchAxisTemplates,
}) => {
  const { axisTemplates, setAxisTemplates } = useAxisTemplate();

  /* ---------- STATE ----------
     items – הטמפלייט שהמשתמש עורך (null עד לטעינה) */

  const [items, setItems] = useState<AxisTemplate | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!axisId) return;

    const load = async () => {
      setLoading(true);
      const data = await getTemplateByAxisId(axisId);
      const tmpl = data && data.length > 0 ? data[0] : null;

      setItems(
        tmpl ?? {
          axisId,
          files: false,
          checklist: false,
          link: false,
          gradeStage: false,
          duration: false,
          feedBack: false,
          Form: false,
          FileResponse: false,
          SolutionFile: false,
          exposureEnabled: false,
          color: false,
          tags: false,
        }
      );
      setLoading(false);
    };
    load();
  }, [axisId, open]);

  /* ---------- רשימת השדות שאנחנו מציגים ----------
     סדר הקבוע בדיוק תואם למערך הכותרות שלמטה */
  const fields: (keyof AxisTemplate)[] = [
    "files",
    "checklist",
    "link",
    "gradeStage",
    "duration",
    "feedBack",
    "Form",
    "FileResponse",
    "SolutionFile",
    "color",
    "tags",
  ];

  /* ---------- כותרות / אייקונים ----------
     האינדקס של כל שדה תואם למיקום במערך `titles`                */
  const titles = [
    { title: "צירוף קבצים", logo: "paperClip" }, // files
    { title: "צ'ק‑ליסט", logo: threeIcon }, // checklist
    { title: "קישור", logo: twoIcon }, // link
    { title: "שלב בהסמכה", logo: fiveIcon }, // gradeStage
    { title: "משך זמן", logo: sixIcon }, // duration
    { title: "משוב", logo: sevenIcon }, // feedBack
    { title: "שאלון", logo: eightIcon }, // Form
    { title: "תגובת קובץ", logo: nineIcon }, // FileResponse
    { title: "קובץ פתרון", logo: nineIcon }, // SolutionFile (ניתן להחליף)
    { title: "צבע", logo: nineIcon }, // color
    { title: "תיוגים", logo: nineIcon }, // tags
  ];

  useEffect(() => {
    fetchAxisTemplates();
  }, []);

  /* ---------- שמירה ----------
     עדכון ב‑store וב‑API */
  const handleSave = async () => {
    if (!items) return;

    try {
      const exists = axisTemplates.some((t) => t?.axisId === axisId);
      if (exists) {
        setAxisTemplates(
          axisTemplates.map((t) => (t?.axisId === axisId ? items : t))
        );
        const res = await updateTemplateAxis(items);
        if (res.status === 200) {
          notification.success({ message: "הטמפלייט עודכן בהצלחה" });
        } else {
          throw new Error("update‑failed");
        }
      } else {
        const res = await createTemplateAxis(items);
        if (res.status === 200) {
          notification.success({ message: "הטמפלייט נוצר בהצלחה" });
          setAxisTemplates([...axisTemplates, items]); // מוסיף למצב המקומי
          fetchAxisTemplates(); // רפרש מה‑backend
        } else {
          throw new Error("create‑failed");
        }
      }
    } catch (e) {
      console.error(e);
      notification.error({ message: "שגיאה בתהליך השמירה" });
    } finally {
      setOpen(false);
    }
  };

  /* ---------- רינדור ----------
     אם עדיין בטעינה – מציגים הודעה פשוטה */
  if (loading || !items) {
    return (
      <Modal open={open} onCancel={() => setOpen(false)} footer={null}>
        <p>טוען…</p>
      </Modal>
    );
  }

  return (
    <Modal
      open={open}
      onCancel={() => setOpen(false)}
      footer={null}
      className={style.container}
    >
      <div className={style.body}>
        {/* כותרת מודאל */}
        <div className={style.title}>
          <div className={style["sub-title"]}>טמפלייט משימה |</div>
          <div className={style["course-name"]}>{courseName}</div>
        </div>

        {/* רינדור כל שדה לפי המערך `fields` */}
        {fields.map((field, idx) => (
          <TemplateItem
            key={field}
            isSelected={items[field] as boolean}
            setItems={setItems}
            itemKey={field}
            title={titles[idx].title}
            Icon={
              titles[idx].logo === "paperClip" ? (
                <PaperClipOutlined
                  rotate={135}
                  style={{ fontSize: "1.5rem" }}
                />
              ) : (
                <img
                  src={titles[idx].logo}
                  alt={titles[idx].title}
                  width={25}
                  height={25}
                />
              )
            }
          />
        ))}

        {/* כפתור שמירה */}
        <BlackButton
          onclickProps={handleSave} // <-- תקן ל‑onClick
          style={{ alignSelf: "flex-start", margin: "2vh 1.5vw 2vh 0" }}
          width="5vw"
          height="4vh"
        >
          שמירה
        </BlackButton>
      </div>
    </Modal>
  );
};

export default EditTemplateAxisModal;
