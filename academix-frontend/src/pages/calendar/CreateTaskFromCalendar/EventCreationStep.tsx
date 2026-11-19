import React, { useMemo, useState } from "react";
import {
  Button,
  DatePicker,
  Flex,
  Form,
  Input,
  Segmented,
  TimePicker,
  Tooltip,
} from "antd";
import { ArrowRightOutlined, SaveOutlined } from "@ant-design/icons";
import dayjs, { Dayjs } from "dayjs";

export interface EventCreationData {
  title: string;
  color: string;
  constant: boolean;
  startDate: Date;
  endDate: Date;
  startHour: number;
  endHour: number;
  recommendedTime: number;
  days: number[];
  courseBatchId: number;
  teamId: number;
}

interface EventCreationStepProps {
  courseBatchId: number;
  teamId: number;
  initialDate?: Date;
  initialStartTime?: string;
  initialEndTime?: string;
  onBack: () => void;
  onSave: (data: EventCreationData) => void;
}

const COLOR_OPTIONS = [
  { key: "coral", from: "#FF7F50", to: "#FFB6A3" },
  { key: "blue", from: "#4A90E2", to: "#A0C4FF" },
  { key: "green", from: "#52C41A", to: "#B7EB8F" },
  { key: "orange", from: "#FA8C16", to: "#FFC069" },
  { key: "purple", from: "#9254DE", to: "#D3ADF7" },
  { key: "pink", from: "#EB2F96", to: "#FF85C0" },
];

const DAYS = ["א", "ב", "ג", "ד", "ה", "ו", "ש"];

const EventCreationStep = ({
  courseBatchId,
  teamId,
  initialDate,
  initialStartTime,
  initialEndTime,
  onBack,
  onSave,
}: EventCreationStepProps) => {
  const [form] = Form.useForm();
  const [eventType, setEventType] = useState<"temporary" | "constant">(
    "temporary"
  );
  const [selectedColor, setSelectedColor] = useState<string>("coral");
  const [selectedDays, setSelectedDays] = useState<number[]>(() =>
    initialDate ? [dayjs(initialDate).day()] : []
  );
  const combineDateWithTime = (date: Dayjs, time: Dayjs) => {
    return date
      .hour(time.hour())
      .minute(time.minute())
      .second(0)
      .millisecond(0);
  };
  const handleStartDateChange = (date: Dayjs | null) => {
    if (!date) {
      form.setFieldValue("startDate", null);
      return;
    }
    const currentTime =
      form.getFieldValue("startTime") || dayjs("09:00", "HH:mm");
    form.setFieldValue("startDate", combineDateWithTime(date, currentTime));
  };

  const handleEndDateChange = (date: Dayjs | null) => {
    if (!date) {
      form.setFieldValue("endDate", null);
      return;
    }
    const currentTime =
      form.getFieldValue("endTime") || dayjs("10:00", "HH:mm");
    form.setFieldValue("endDate", combineDateWithTime(date, currentTime));
  };
  const defaultValues = useMemo(
    () => ({
      startTime: dayjs(initialStartTime ?? "09:00", "HH:mm"),
      endTime: dayjs(initialEndTime ?? "10:00", "HH:mm"),
      startDate: initialDate ? dayjs(initialDate) : dayjs(),
      endDate: initialDate ? dayjs(initialDate) : dayjs(),
    }),
    [initialDate, initialStartTime, initialEndTime]
  );

  const handleFinish = (values: {
    title: string;
    startTime: Dayjs;
    endTime: Dayjs;
    startDate: Dayjs;
    endDate?: Dayjs;
  }) => {
    const startDate = values.startDate;
    const endDate =
      eventType === "constant" && values.endDate ? values.endDate : startDate;
    const startDateWithTime = startDate.toDate();
    startDateWithTime.setHours(
      values.startTime.hour(),
      values.startTime.minute(),
      0,
      0
    );

    const endDateWithTime = endDate.toDate();
    endDateWithTime.setHours(
      values.endTime.hour(),
      values.endTime.minute(),
      0,
      0
    );
    onSave({
      title: values.title,
      color: selectedColor,
      constant: eventType === "constant",
      startDate: startDateWithTime,
      endDate: endDateWithTime,
      startHour: values.startTime.hour() * 60 + values.startTime.minute(),
      endHour: values.endTime.hour() * 60 + values.endTime.minute(),
      recommendedTime:
        values.endTime.hour() * 60 +
        values.endTime.minute() -
        (values.startTime.hour() * 60 + values.startTime.minute()),
      days: eventType === "constant" ? selectedDays : [],
      courseBatchId,
      teamId,
    });
  };

  return (
    <div style={{ maxWidth: 560, margin: "0 auto" }}>
      <Form
        form={form}
        layout="vertical"
        initialValues={defaultValues}
        onFinish={handleFinish}
      >
        <Form.Item
          name="title"
          label="שם האירוע"
          rules={[
            { required: true, whitespace: true, message: "נא להזין שם אירוע" },
          ]}
          style={{ marginBottom: 16 }}
        >
          <Input size="large" placeholder="לדוגמה: הרצאה אורחת" />
        </Form.Item>

        <Form.Item label="סוג אירוע" style={{ marginBottom: 16 }}>
          <Segmented
            block
            value={eventType}
            onChange={(value) =>
              setEventType(value as "temporary" | "constant")
            }
            options={[
              { label: "זמני", value: "temporary" },
              { label: "חזרתי", value: "constant" },
            ]}
          />
        </Form.Item>

        <Flex gap={12} wrap>
          <Form.Item
            name="startDate"
            label={eventType === "constant" ? "תאריך התחלה" : "תאריך"}
            rules={[{ required: true, message: "נא להזין תאריך" }]}
            style={{ flex: 1 }}
          >
            <DatePicker
              style={{ width: "100%" }}
              format="DD/MM/YY"
              onChange={handleStartDateChange}
            />
          </Form.Item>

          {eventType === "constant" && (
            <Form.Item
              name="endDate"
              label="תאריך סיום"
              rules={[
                { required: true, message: "נא להזין תאריך סיום" },
                {
                  validator: (_, value: Dayjs) => {
                    const startDate = form.getFieldValue("startDate");
                    if (!value || !startDate) return Promise.resolve();
                    return value.isBefore(startDate, "day")
                      ? Promise.reject(
                          new Error("תאריך סיום צריך להיות אחרי תאריך התחלה")
                        )
                      : Promise.resolve();
                  },
                },
              ]}
              style={{ flex: 1 }}
            >
              <DatePicker
                style={{ width: "100%" }}
                format="DD/MM/YY"
                onChange={handleEndDateChange}
              />
            </Form.Item>
          )}
        </Flex>

        <Flex gap={12}>
          <Form.Item
            name="startTime"
            label="שעת התחלה"
            rules={[{ required: true, message: "נא להזין שעה" }]}
            style={{ flex: 1 }}
          >
            <TimePicker format="HH:mm" style={{ width: "100%" }} />
          </Form.Item>

          <Form.Item
            name="endTime"
            label="שעת סיום"
            rules={[{ required: true, message: "נא להזין שעת סיום" }]}
            style={{ flex: 1 }}
          >
            <TimePicker format="HH:mm" style={{ width: "100%" }} />
          </Form.Item>
        </Flex>

        {eventType === "constant" && (
          <Form.Item label="ימי חזרה" style={{ marginBottom: 16 }}>
            <Flex gap={8} wrap>
              {DAYS.map((day, index) => {
                const dayNumber = index + 1; // maintenant 1,2,3,4,5,6,7

                return (
                  <Tooltip key={day} title={day}>
                    <div
                      onClick={() =>
                        setSelectedDays((prev) =>
                          prev.includes(dayNumber)
                            ? prev.filter((d) => d !== dayNumber)
                            : [...prev, dayNumber]
                        )
                      }
                      style={{
                        width: 42,
                        height: 42,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        borderRadius: 12,
                        cursor: "pointer",
                        fontWeight: selectedDays.includes(dayNumber)
                          ? 700
                          : 400,
                        border: selectedDays.includes(dayNumber)
                          ? "2px solid #4A90E2"
                          : "1px solid #d9d9d9",
                        background: selectedDays.includes(dayNumber)
                          ? "#e6f4ff"
                          : "white",
                      }}
                    >
                      {day}
                    </div>
                  </Tooltip>
                );
              })}
            </Flex>
          </Form.Item>
        )}

        <Form.Item label="צבע" style={{ marginBottom: 24 }}>
          <Flex gap={10}>
            {COLOR_OPTIONS.map((color) => (
              <Tooltip key={color.key} title={color.key}>
                <div
                  onClick={() => setSelectedColor(color.key)}
                  style={{
                    width: 36,
                    height: 36,
                    borderRadius: "50%",
                    cursor: "pointer",
                    border:
                      selectedColor === color.key
                        ? "3px solid white"
                        : "2px solid transparent",
                    boxShadow:
                      selectedColor === color.key
                        ? "0 0 0 2px #1890ff"
                        : "0 1px 4px rgba(0,0,0,0.15)",
                    background: `linear-gradient(135deg, ${color.from}, ${color.to})`,
                  }}
                />
              </Tooltip>
            ))}
          </Flex>
        </Form.Item>

        <Flex justify="space-between">
          <Button size="large" onClick={onBack} icon={<ArrowRightOutlined />}>
            חזור
          </Button>
          <Button
            type="primary"
            size="large"
            htmlType="submit"
            icon={<SaveOutlined />}
          >
            צור אירוע
          </Button>
        </Flex>
      </Form>
    </div>
  );
};

export default EventCreationStep;
