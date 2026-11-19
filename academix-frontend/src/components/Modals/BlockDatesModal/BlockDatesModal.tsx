import React, { useEffect, useState } from "react";
import { Modal, DatePicker, Button, Spin, message, Tooltip } from "antd";
import dayjs from "dayjs";
import BlackButton from "../../../UI/Button/BlackButton";
import { InfoCircleOutlined } from "@ant-design/icons";
import {
  blockTasksForStudents,
  resetBlockedPeriod,
} from "../../../services/ApiServices";
import { useBlockedDatesStore } from "../../../store/blockedDatesStore";

interface BlockDatesModalProps {
  isOpen: boolean;
  onClose: () => void;
  onOpen: () => void;
  selectedTeamId: number;
  selectedCourseBatchId: number;
  blockedLabelProps?: string;
}

export default function BlockDatesModal({
  isOpen,
  onClose,
  onOpen,
  selectedTeamId,
  selectedCourseBatchId,
  blockedLabelProps,
}: BlockDatesModalProps) {
  const [saving, setSaving] = useState(false);

  const {
    blockFrom,
    setBlockFrom,
    blockTo,
    setBlockTo,
    savedBlockFrom,
    savedBlockTo,
    setSavedBlockedDates,
    reset,
  } = useBlockedDatesStore();

  // Disabled dates for "from" DatePicker - can't select dates after "to"
  const disabledFromDates = (current: dayjs.Dayjs) => {
    if (blockTo) {
      return current.isAfter(blockTo, "day");
    }
    return false;
  };

  // Disabled dates for "to" DatePicker - can't select dates before "from"
  const disabledToDates = (current: dayjs.Dayjs) => {
    if (blockFrom) {
      return current.isBefore(blockFrom, "day");
    }
    return false;
  };


  const handleFromChange = (date: dayjs.Dayjs | null) => {
    setBlockFrom(date);

    if (date && blockTo && date.isAfter(blockTo, "day")) {
      setBlockTo(null);
    }
  };

  const handleToChange = (date: dayjs.Dayjs | null) => {
    setBlockTo(date);

    if (date && blockFrom && date.isBefore(blockFrom, "day")) {
      setBlockFrom(null);
    }
  };

  const handleSave = async () => {
    if (!blockFrom || !blockTo) {
      message.warning("נא לבחור שני תאריכים");
      return;
    }

    // Check that from is not after to
    if (blockFrom.isAfter(blockTo, "day")) {
      message.warning("תאריך התחלה לא יכול להיות לאחר תאריך סיום");
      return;
    }

    const datesChanged =
      savedBlockFrom?.format("YYYY-MM-DD") !== blockFrom.format("YYYY-MM-DD") ||
      savedBlockTo?.format("YYYY-MM-DD") !== blockTo.format("YYYY-MM-DD");

    if (!datesChanged) {
      message.info("לא בוצעו שינויים בתאריכים");
      onClose();
      return;
    }

    const fromISO = blockFrom.startOf("day").toISOString();
    const toISO = blockTo.endOf("day").toISOString();
    setSaving(true);

    try {
      const data = await blockTasksForStudents(
        selectedTeamId,
        selectedCourseBatchId,
        fromISO,
        toISO
      );
      message.success("החסימה נשמרה בהצלחה");
      if (data.success) setSavedBlockedDates(blockFrom, blockTo);
      onClose();
    } catch (e) {
      console.error(e);
      message.error("שמירת החסימה נכשלה");
    } finally {
      setSaving(false);
    }
  };

  const handleReset = async () => {
    if (savedBlockFrom === null || savedBlockTo === null) return;

    Modal.confirm({
      title: "האם אתה בטוח שברצונך להסיר את תקופת החסימה?",
      okText: "כן, מחק",
      cancelText: "ביטול",
      onOk: async () => {
        setSaving(true);
        try {
          await resetBlockedPeriod(selectedTeamId, selectedCourseBatchId);
          message.success("החסימה הוסרה");
          reset();
          onClose();
        } catch (e) {
          console.error(e);
          message.error("הסרת החסימה נכשלה");
        } finally {
          setSaving(false);
        }
      },
    });
  };

  const blockedLabel =
    savedBlockFrom && savedBlockTo
      ? ` חסום מתאריך ${savedBlockFrom.format(
          "DD/MM"
        )} - עד ${savedBlockTo.format("DD/MM")}`
      : "חסימת משימות";

  useEffect(() => {  
    setBlockFrom(savedBlockFrom);
    setBlockTo(savedBlockTo);
  }, [isOpen]);
  return (
    <>
      <BlackButton onclickProps={onOpen} height="20" width="20">
        {blockedLabelProps || blockedLabel}
      </BlackButton>

      <Modal
        open={isOpen}
        title={
          <p>
            חסימת משימות{" "}
            <Tooltip title="התלמידים לא יראו את שיבוץ המשימות בטווח התאריכים">
              <InfoCircleOutlined style={{ cursor: "pointer" }} />
            </Tooltip>
          </p>
        }
        onCancel={onClose}
        footer={[
          <Button key="reset" danger onClick={handleReset} loading={saving}>
            מחיקת חסימה
          </Button>,
          <BlackButton
            height="10"
            width="10"
            key="save"
            onclickProps={handleSave}
          >
            שמירה
          </BlackButton>,
        ]}
      >
        <>
          <div style={{ marginBottom: 16 }}>
            <span style={{ marginRight: 8 }}>מתאריך:</span>
            <DatePicker
              value={blockFrom}
              onChange={handleFromChange}
              disabledDate={disabledFromDates}
              style={{ width: "100%" }}
              placeholder="בחר תאריך התחלה"
            />
          </div>
          <div>
            <span style={{ marginRight: 8 }}>עד תאריך:</span>
            <DatePicker
              value={blockTo}
              onChange={handleToChange}
              disabledDate={disabledToDates}
              disabled={!blockFrom}
              style={{ width: "100%" }}
              placeholder="בחר תאריך סיום"
            />
          </div>
        </>
      </Modal>
    </>
  );
}
