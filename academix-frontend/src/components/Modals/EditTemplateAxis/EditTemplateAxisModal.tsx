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

import { createTemplateAxis, updateTemplateAxis } from "../../../services/ApiServices";
import { AxisTemplate } from "../../../types/types";
import { useQueryClient } from "@tanstack/react-query";
import { axisTemplateKeys } from "../../../api/queryKeys";
import { emptyAxisTemplate, useAxisTemplateQuery } from "../../../hooks/useAxisTemplateQuery";

type Props = {
  open: boolean;
  setOpen: React.Dispatch<React.SetStateAction<boolean>>;
  courseName?: string;
  axisId?: number;
};

const EditTemplateAxisModal: React.FC<Props> = ({
  open,
  setOpen,
  courseName,
  axisId,
}) => {
  const queryClient = useQueryClient();
  // The axis template from the server (null = the axis has no template yet). It decides
  // update vs create; this used to come from a separate store, filled by another request.
  const { refetch: refetchTemplate, data: serverTemplate } = useAxisTemplateQuery(axisId);

  /* ---------- STATE ----------
     items – הטמפלייט שהמשתמש עורך (null עד לטעינה) */

  const [items, setItems] = useState<AxisTemplate | null>(null);
  const [loading, setLoading] = useState(true);

  // Each time the modal opens: load the current template into the edited form
  useEffect(() => {
    if (!axisId) return;
    let cancelled = false;
    setLoading(true);
    refetchTemplate().then(({ data }) => {
      if (cancelled) return;
      setItems(data ?? emptyAxisTemplate(axisId));
      setLoading(false);
    });
    return () => {
      cancelled = true;
    };
    // refetchTemplate is stable; reload on open, as before
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

  /* ---------- שמירה ----------
     עדכון ב‑API, ואז רענון של הטמפלייט (גם ב‑NewTaskModal) */
  const handleSave = async () => {
    if (!items) return;

    try {
      // the template loaded when the modal opened: it exists on the server or not
      const exists = !!serverTemplate;
      if (exists) {
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
        } else {
          throw new Error("create‑failed");
        }
      }
      queryClient.invalidateQueries({ queryKey: axisTemplateKeys.byAxis(axisId) });
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
