import { teamEventKeys } from "../../../api/queryKeys";
import {
  CalendarOutlined,
  CloseOutlined,
  DeleteOutlined,
  EditFilled,
  EditOutlined,
  HourglassOutlined,
  LockOutlined,
  PlusCircleFilled,
  SearchOutlined,
} from "@ant-design/icons";
import React, { useEffect, useRef, useState } from "react";
import {
  colors,
  Gradient,
  schemaMap,
  TeamEvent,
  TeamEventAssignment,
} from "../../../types/types";
import style from "./teamEventBank.module.css";
import {
  Card,
  Input,
  Form,
  Button,
  Tooltip,
  Popconfirm,
  TimePicker,
  Flex,
  Col,
  DatePicker,
  Tabs,
} from "antd";

import { useForm } from "antd/es/form/Form";
import { useSelectionsStore } from "../../../store/selectionStore";
import {
  useAddTeamEvent,
  useRemoveTeamEvent,
  useTeamEvent,
  useUpdateTeamEvent,
} from "../../../hooks/useTeamEvent";
import { useQueryClient } from "@tanstack/react-query";
import { Draggable } from "fullcalendar";
import dayjs, { Dayjs } from "dayjs";
import TabPane from "antd/es/tabs/TabPane";
type Props = {
  generateConstantTeamEvent: (
    start: Date,
    end: Date,
    startHour: number,
    endHour: number,
    teamEventAssignment: Omit<TeamEventAssignment, "id">,
    days: number[]
  ) => void;
};
interface TeamEventFields
  extends Omit<TeamEvent, "id" | "teamCourseBatchId" | "title"> {
  startMinutes: number;
  endMinutes: number;
}

const TeamEventBank = (props: Props) => {
  const queryClient = useQueryClient();

  const minutesToDayjs = (totalMinutes: number | undefined) => {
    const minutes = totalMinutes || 0;
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return dayjs().set("hours", hours).set("minutes", mins);
  };

  function hexToRgba(hex: string, alpha = 1): string {
    const clean = hex.replace("#", "");
    const fullHex =
      clean.length === 3
        ? clean
            .split("")
            .map((c) => c + c)
            .join("")
        : clean;
    if (fullHex.length !== 6) {
      return "rgba(255, 240, 245, 1)";
    }
    const r = parseInt(fullHex.slice(0, 2), 16);
    const g = parseInt(fullHex.slice(2, 4), 16);
    const b = parseInt(fullHex.slice(4, 6), 16);
    const clampedAlpha = Math.min(1, Math.max(0, alpha));
    return `rgba(${r}, ${g}, ${b}, ${clampedAlpha})`;
  }

  const getTransparentGradient = (cv: Gradient, opacity: number = 0.5) => {
    if (!cv) return "rgba(255, 240, 245, 1)";
    return `${hexToRgba(cv.to, opacity)}`;
  };

  const [formTeamEvent] = useForm();
  const {
    selectedTeam,
    selectedCourseBatch,
    selectedCourse,
    selectedTeamMember,
  } = useSelectionsStore();
  const { data: allTeamEvents = [] } = useTeamEvent();
  const [teamEvents, setTeamEvents] = useState<TeamEvent[]>(allTeamEvents);

  const [filterByName, setFilterByName] = useState<string>("");
  const [teamEventFields, setTeamEventFields] = useState<
    Partial<TeamEventFields>
  >({ constant: false });
  const [days, setDays] = useState<number[]>([]);
  const [selectedColor, setSelectedColor] = useState<string>("coral");
  const [selectedEvent, setSelectedEvent] = useState<TeamEvent | null>(null);
  const removeTeamEventMutation = useRemoveTeamEvent();
  const eventTeamRef = useRef<HTMLDivElement | null>(null);
  const addTeamEventMutation = useAddTeamEvent();
  const updateTeamEventMutation = useUpdateTeamEvent();

  // פונקציות ולידציה לתאריכים
  const validateStartDate = (_: any, value: any) => {
    if (!value) {
      return Promise.reject(new Error("נא להזין תאריך התחלה"));
    }
    const today = dayjs().startOf("day");
    if (value.isBefore(today, "day")) {
      return Promise.reject(new Error("תאריך התחלה לא יכול להיות קטן מהיום"));
    }
    return Promise.resolve();
  };
  const editConst = (event: TeamEvent) => {
    if (selectedEvent?.id === event.id) {
      resetEdit();
    } else {
      setSelectedEvent(event);

      // Safely convert dates - only call dayjs if the date exists
      const startDateValue = event.startDate ? dayjs(event.startDate) : null;
      const endDateValue = event.endDate ? dayjs(event.endDate) : null;

      formTeamEvent.setFieldsValue({
        ...event,
        endDate: endDateValue,
        startDate: startDateValue,
        startMinutes: minutesToDayjs(event.startHour || 60),
        endMinutes: minutesToDayjs(event.endHour || 60),
      });

      setDays(event.days.map((day: any) => day.dayNum));
      setSelectedColor(event?.color!);
      formTeamEvent.setFieldValue("constant", event.constant);

      setTeamEventFields((prevTeamEvent) => ({
        ...prevTeamEvent,
        constant: event.constant,
        startMinutes: event.startHour,
        endMinutes: event.endHour,
        startDate: event.startDate,
        endDate: event.endDate,
      }));
    }
  };
  const editTemp = (event: TeamEvent) => {
    if (selectedEvent?.id === event.id) {
      resetEdit();
    } else {
      setSelectedEvent(event);

      formTeamEvent.setFieldValue("constant", event.constant);

      formTeamEvent.setFieldsValue(event);
      setSelectedColor(event?.color!);
      setTeamEventFields((prevTeamEvent) => ({
        ...prevTeamEvent,
        ...selectedEvent,
        constant: event.constant,
      }));
    }
  };
  const validateEndDate = (_: any, value: any) => {
    if (!value) {
      return Promise.reject(new Error("נא להזין תאריך סיום"));
    }
    const startDate = formTeamEvent.getFieldValue("startDate");
    if (startDate && value.isBefore(startDate, "day")) {
      return Promise.reject(
        new Error("תאריך סיום חייב להיות גדול או שווה לתאריך התחלה")
      );
    }
    return Promise.resolve();
  };

  // פונקציות disabledDate ל-DatePicker - גרסה פשוטה
  const disabledStartDate = (current: Dayjs | null) => {
    return current ? current.isBefore(dayjs(), "day") : false;
  };
  const resetEdit = () => {
    setSelectedEvent(null);
    formTeamEvent.resetFields();
    setTeamEventFields({ constant: false });
    setDays([]);
  };
  const disabledEndDate = (current: Dayjs | null) => {
    if (!current) return false;

    const today = dayjs();
    const startDateValue = formTeamEvent.getFieldValue("startDate");

    // מנע תאריכים לפני היום
    const beforeToday = current.isBefore(today, "day");

    // מנע תאריכים לפני תאריך התחלה
    const beforeStart = startDateValue
      ? current.isBefore(dayjs(startDateValue), "day")
      : false;

    return (
      beforeToday ||
      beforeStart ||
      current.isAfter(
        dayjs(selectedCourseBatch.start_date).add(
          selectedCourse.duration_months,
          "month"
        )
      )
    );
  };

  const handleMakeTemporary = () => {
    formTeamEvent.setFieldValue("constant", false);
    setDays([]);
    setTeamEventFields((prev) => ({
      ...prev,
      constant: false,
      startMinutes: undefined,
      endMinutes: undefined,
    }));
    formTeamEvent.setFieldsValue({
      startDate: null,
      endDate: null,
    });
  };

  const handleMakeConstant = () => {
    formTeamEvent.setFieldValue("constant", true);
    setTeamEventFields((prev) => ({
      ...prev,
      constant: true,
    }));
  };

  const createTeamEvent = async (values: any) => {
    const { color, startDate, endDate, title } = values;
    const isConstant = teamEventFields.constant ?? false;

    const baseEventData = {
      color,
      title,
      constant: isConstant,
      days: isConstant ? days : [],
      startDate: isConstant ? startDate : null,
      endDate: isConstant ? endDate : null,
      startHour: isConstant ? teamEventFields.startMinutes ?? null : null,
      endHour: isConstant ? teamEventFields.endMinutes ?? null : null,
      recommendedTime: isConstant ? teamEventFields.startMinutes || 60 : 60,
    };

    if (selectedEvent) {
      updateTeamEventMutation.mutate(
        {
          ...selectedEvent,
          ...baseEventData,
          id: selectedEvent.id,
        },
        {
          onSuccess: (data) => {
            queryClient.invalidateQueries({ queryKey: teamEventKeys.all });
            queryClient.invalidateQueries({
              queryKey: ["teamEventsAssignment"],
            });
            if (isConstant) {
              props.generateConstantTeamEvent(
                startDate,
                endDate,
                teamEventFields.startMinutes!,
                teamEventFields.endMinutes!,
                {
                  start: startDate,
                  end: endDate,
                  TeamEventId: data.id,
                },
                data.days.map((day: any) => day.dayNum % 7)
              );
            }
            resetEdit();
          },
        }
      );
    } else
      addTeamEventMutation.mutate(
        {
          courseBatchId: selectedCourseBatch.id,
          teamId: selectedTeam.id,
          ...baseEventData,
        },
        {
          onSuccess: (data) => {
            queryClient.invalidateQueries({ queryKey: teamEventKeys.all });
            if (isConstant) {
              props.generateConstantTeamEvent(
                startDate,
                endDate,
                teamEventFields.startMinutes!,
                teamEventFields.endMinutes!,
                {
                  start: startDate.toDate(),
                  end: endDate.toDate(),
                  TeamEventId: data.id,
                },
                data.days.map((day: any) => day.dayNum % 7)
              );
            }
            formTeamEvent.resetFields();
            setTeamEventFields({ constant: false });
            setSelectedColor("coral");
            setDays([]);
          },
        }
      );
  };

  const onCreateTeamEventFailed = (errorInfo: any) => {
    console.log("Failed:", errorInfo);
  };

  useEffect(() => {
    setTeamEvents(
      allTeamEvents.filter((teamEvent: TeamEvent) =>
        teamEvent.title.includes(filterByName)
      )
    );
  }, [allTeamEvents, filterByName]);

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      const container = document.getElementById("event-bank-container");
      if (!container) return;

      const draggable = new Draggable(container, {
        itemSelector: ".tempTeamEvent",

        eventData: function (el) {
          const id = el.getAttribute("data-id");
          if (id) {
            return {
              ...teamEvents.find(
                (event) => !event.constant && event.id === parseInt(id)
              ),
            };
          }
        },
      });
      return () => draggable.destroy();
    }, 150);
    return () => clearTimeout(timeoutId);
  }, [teamEvents]);

  return (
    <div
      id="event-bank-container"
      ref={eventTeamRef}
      style={{
        display: "flex",
        flexDirection: "column",
        rowGap: "1vh",
        padding: ".8vw",
      }}
    >
      <span style={{ fontSize: "1rem", fontWeight: "bold" }}>
        בנק אירועים קבועים - צוות {selectedTeam?.name ? selectedTeam?.name : ""}
      </span>
      <span style={{ fontSize: "0.7rem" }}>{selectedTeam.name}</span>
      <Input
        placeholder="חפש אירוע"
        value={filterByName}
        onChange={({ target }) => {
          setFilterByName(target.value);
          resetEdit();
        }}
        style={{ borderRadius: "40px" }}
        prefix={<SearchOutlined style={{ position: "absolute", left: 2 }} />}
      />
      <Card styles={{ body: { padding: " 10px 10px" } }}>
        <Form
          form={formTeamEvent}
          layout="vertical"
          onFinish={createTeamEvent}
          onFinishFailed={onCreateTeamEventFailed}
        >
          {/* שם האירוע */}
          {selectedEvent && (
            <div style={{ display: "flex", justifyContent: "space-between" }}>
              <h3 style={{ margin: 0 }}>עריכת אירוע</h3>{" "}
              <CloseOutlined
                onClick={() => {
                  setSelectedEvent(null);
                  formTeamEvent.resetFields();
                  setTeamEventFields({ constant: false });
                  setDays([]);
                }}
              />
            </div>
          )}
          <Form.Item
            style={{ margin: 0 }}
            label="שם האירוע"
            name="title"
            rules={[
              {
                required: true,
                whitespace: true,
                message: "נא להזין שם אירוע",
              },
            ]}
          >
            <Input style={{ width: "10vw" }} />
          </Form.Item>

          {/* זמני האירוע */}
          {teamEventFields.constant && (
            <Flex gap={"1vw"}>
              <Col>
                <Form.Item style={{ margin: 0 }} label="זמני האירוע">
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "start",
                      gap: ".5vw",
                      alignItems: "center",
                    }}
                  >
                    <Form.Item
                      name="startMinutes"
                      noStyle
                      rules={[
                        { required: true, message: "נא להזין שעות ודקות" },
                      ]}
                    >
                      <TimePicker
                        onChange={(value) => {
                          if (value) {
                            setTeamEventFields((prevFields) => ({
                              ...prevFields,
                              startMinutes: value.hour() * 60 + value.minute(),
                            }));
                          }
                        }}
                        format="HH:mm"
                        placeholder="התחלה"
                        style={{ width: "4vw" }}
                        value={minutesToDayjs(teamEventFields.startMinutes)}
                      />
                    </Form.Item>
                    <Form.Item
                      name="endMinutes"
                      noStyle
                      rules={[
                        { required: true, message: "נא להזין שעות ודקות" },
                      ]}
                    >
                      <TimePicker
                        onChange={(value) => {
                          if (value) {
                            setTeamEventFields((prevFields) => ({
                              ...prevFields,
                              endMinutes: value.hour() * 60 + value.minute(),
                            }));
                          }
                        }}
                        format="HH:mm"
                        placeholder="סוף"
                        style={{ width: "4vw" }}
                        value={minutesToDayjs(teamEventFields.endMinutes)}
                      />
                    </Form.Item>
                  </div>
                </Form.Item>{" "}
              </Col>

              <Col>
                {teamEventFields.constant && (
                  <Flex align="start">
                    <Col>
                      <Form.Item
                        name="startDate"
                        style={{ margin: 0 }}
                        label={
                          <h5 style={{ margin: 0, whiteSpace: "nowrap" }}>
                            תאריך התחלה
                          </h5>
                        }
                        rules={[
                          {
                            validator: (_: any, value: any) => {
                              if (!selectedEvent && value) {
                                return validateStartDate(_, value);
                              } else if (!value) {
                                return Promise.reject(
                                  new Error("נא להזין תאריך התחלה")
                                );
                              }
                              return Promise.resolve();
                            },
                          },
                        ]}
                      >
                        <DatePicker
                          format="DD/MM/YY"
                          suffixIcon={null}
                          style={{ height: "3vh", width: "4.3vw" }}
                          disabledDate={disabledStartDate}
                        />
                      </Form.Item>
                    </Col>
                    <Col>
                      <Form.Item
                        name="endDate"
                        style={{ margin: 0 }}
                        label={<h5 style={{ margin: 0 }}>תאריך סיום</h5>}
                        rules={[
                          {
                            validator: (_: any, value: any) => {
                              if (!selectedEvent && value) {
                                return validateEndDate(_, value);
                              } else if (!value) {
                                return Promise.reject(
                                  new Error("נא להזין תאריך סוף")
                                );
                              }
                              return Promise.resolve();
                            },
                          },
                        ]}
                      >
                        <DatePicker
                          format="DD/MM/YY"
                          suffixIcon={null}
                          style={{ height: "3vh", width: "4.3vw" }}
                          disabledDate={disabledEndDate}
                        />
                      </Form.Item>
                    </Col>
                  </Flex>
                )}
              </Col>
            </Flex>
          )}
          <Flex
            justify={teamEventFields.constant ? "space-between" : "start"}
            gap={"3.5vw"}
          >
            <Form.Item
              name="color"
              noStyle
              initialValue={selectedColor}
              rules={[{ required: true, message: "נא לבחור צבע" }]}
            >
              <Tooltip
                color="white"
                arrow={false}
                trigger="click"
                placement="bottomRight"
                title={
                  <div className={style["color-picker-tooltip"]}>
                    <div className={style["colors-container"]}>
                      {colors.map((color) => {
                        const gradient = schemaMap[color];
                        return (
                          <div
                            key={color}
                            className={`${style["color-option"]} ${
                              selectedColor === color ? style["selected"] : ""
                            }`}
                            style={{
                              background: `linear-gradient(135deg, ${gradient.from}, ${gradient.to})`,
                            }}
                            onClick={() => {
                              formTeamEvent.setFieldValue("color", color);
                              setTeamEventFields((prevFields) => ({
                                ...prevFields,
                                color: color,
                              }));
                              setSelectedColor(color);
                            }}
                          />
                        );
                      })}
                    </div>
                  </div>
                }
              >
                <div>צבע</div>
                <Tooltip color="gray" title="בחר צבע">
                  <div
                    className={style["color-preview"]}
                    style={{
                      background: selectedColor
                        ? `linear-gradient(135deg, ${schemaMap[selectedColor].from}, ${schemaMap[selectedColor].to})`
                        : "linear-gradient(135deg, #E95742,#FF9E90)",
                    }}
                  />
                </Tooltip>
              </Tooltip>
            </Form.Item>{" "}
            {teamEventFields.constant && (
              <Form.Item style={{ margin: 0 }} label="חזרתיות">
                <Flex gap={".2vw"}>
                  {new Array(7).fill(1488).map((item, index) => (
                    <Button
                      onClick={() => {
                        if (days.includes(index + 1)) {
                          setDays(days.filter((day) => day !== 1 + index));
                        } else {
                          setDays([...days, index + 1]);
                        }
                      }}
                      style={{
                        width: "1vw",
                        padding: 0,
                        height: "3vh",
                        backgroundColor: days.includes(index + 1)
                          ? "beige"
                          : "white",
                      }}
                    >
                      {String.fromCharCode(item + index)}
                    </Button>
                  ))}
                </Flex>
              </Form.Item>
            )}
          </Flex>

          <Form.Item name="constant" noStyle>
            <div
              style={{
                marginTop: ".5vh",
                display: "flex",
                justifyContent: "start",
                gap: ".2vw",
                width: "65%",
              }}
            >
              <div
                onClick={handleMakeTemporary}
                style={{
                  backgroundColor: `${
                    teamEventFields.constant ? "rgb(223 214 186)" : "white"
                  }`,
                  border: "4px solid rgb(223 214 186)",
                  borderRadius: "40px",
                  width: "4vw",
                  height: "2.5vh",
                  display: "flex",
                  justifyContent: "center",
                  alignItems: "center",
                  cursor: "pointer",
                }}
              >
                זמני
              </div>{" "}
              <div
                onClick={handleMakeConstant}
                style={{
                  backgroundColor: `${
                    !teamEventFields.constant ? "rgb(223 214 186)" : "white"
                  }`,
                  border: "4px solid rgb(223 214 186)",
                  borderRadius: "40px",
                  width: "4vw",
                  height: "2.5vh",
                  display: "flex",
                  justifyContent: "center",
                  alignItems: "center",
                  cursor: "pointer",
                }}
              >
                חזרתי
              </div>
            </div>
          </Form.Item>
          {/* הוראה לגרירה */}

          <Tooltip title={selectedEvent ? "ערוך אירוע" : "הוסף אירוע"}>
            <Button
              htmlType="submit"
              shape="round"
              style={{
                width: "3vw",
                padding: 0,
                position: "absolute",
                left: 0,
                bottom: ".4vh",
                backgroundColor: "black",
                color: "white",
              }}
            >
              שמור
            </Button>
          </Tooltip>
        </Form>
      </Card>

      <Tabs
        onChange={() => {
          resetEdit();
        }}
        defaultActiveKey="1"
      >
        <TabPane
          tab={
            <div style={{ color: "white" }}>
              זמני
              <HourglassOutlined style={{ marginRight: ".4vw" }} />
            </div>
          }
          key="1"
        >
          <div className={style["team_events"]}>
            {teamEvents.filter((event) => !event.constant).length > 0 &&
              teamEvents
                .filter((event) => !event.constant)
                .map((event: TeamEvent, index: number) => {
                  return (
                    <Tooltip title="גרור על מנת לקבוע לוז חד פעמי">
                      <div
                        onClick={(e) => {
                          e.stopPropagation();
                          editTemp(event);

                          setTimeout(() => {}, 1000);
                        }}
                        data-id={event.id}
                        data-team-event={true}
                        className={`${style["tempTeamEvent"]} tempTeamEvent`}
                        style={{
                          backgroundColor: getTransparentGradient(
                            schemaMap[event.color],
                            0.6
                          ),
                          boxShadow: "0px 2px 4px rgba(252, 251, 251, 0.5)",
                          border:
                            selectedEvent?.id === event.id
                              ? `4px solid white`
                              : `3px dashed ${schemaMap[event.color].to}`,
                        }}
                      >
                        {event.title.length < 15
                          ? event.title
                          : event.title.slice(0, 12) + "..."}
                        <div className={style["icons_container"]}>
                          {" "}
                          {
                            <Popconfirm
                              title="האם בטוח שתרצה למחוק את סוג האירוע הזה מחיקת אירוע תמחק את כל השיבוצים של אותו אירוע"
                              trigger="click"
                              onConfirm={() => {
                                removeTeamEventMutation.mutate(event.id, {
                                  onSuccess: () => {
                                    queryClient.invalidateQueries({
                                      queryKey: teamEventKeys.all,
                                    });
                                    resetEdit();
                                  },
                                });
                              }}
                            >
                              <Tooltip title="מחיקה">
                                <DeleteOutlined
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    resetEdit();
                                  }}
                                  style={{ color: "red", cursor: "pointer" }}
                                />
                              </Tooltip>
                            </Popconfirm>
                          }
                        </div>
                      </div>
                    </Tooltip>
                  );
                })}
          </div>
        </TabPane>

        <TabPane
          tab={
            <div style={{ color: "white" }}>
              קבוע <LockOutlined style={{ marginRight: ".3vw" }} />
            </div>
          }
          key="2"
        >
          <div className={style["team_events"]}>
            {teamEvents.filter((event) => event.constant).length > 0 &&
              teamEvents
                .filter((event) => event.constant)
                .map((event: TeamEvent) => {
                  return (
                    <Tooltip title="לחץ על מנת לערוך" placement="top">
                      <div
                        onClick={() => editConst(event)}
                        className={style["constantTeamEvent"]}
                        style={{
                          backgroundColor: getTransparentGradient(
                            schemaMap[event.color],
                            0.6
                          ),
                          boxShadow: "0px 2px 4px rgba(252, 251, 251, 0.5)",
                          border:
                            selectedEvent?.id === event.id
                              ? `4px solid white`
                              : `3px dashed ${schemaMap[event.color].to}`,
                        }}
                      >
                        {event.title.length < 15
                          ? event.title
                          : event.title.slice(0, 12) + "..."}
                        <div className={style["icons_container"]}>
                          {" "}
                          {}
                          <Popconfirm
                            title="האם בטוח שתרצה למחוק את סוג האירוע הזה"
                            trigger="click"
                            onConfirm={() => {
                              removeTeamEventMutation.mutate(event.id, {
                                onSuccess: () => {
                                  queryClient.invalidateQueries({
                                    queryKey: teamEventKeys.all,
                                  });
                                },
                              });
                              resetEdit();
                            }}
                          >
                            <Tooltip title="מחיקה">
                              <DeleteOutlined
                                onClick={(e) => {
                                  e.stopPropagation();
                                }}
                                style={{ color: "red", cursor: "pointer" }}
                              />
                            </Tooltip>
                          </Popconfirm>
                        </div>
                      </div>
                    </Tooltip>
                  );
                })}
          </div>
        </TabPane>
      </Tabs>
      {teamEvents.length === 0 && (
        <h2 className={style["empty"]}>אין תוצאות</h2>
      )}
    </div>
  );
};

export default TeamEventBank;