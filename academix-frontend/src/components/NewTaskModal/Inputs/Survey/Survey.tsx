import React, { useEffect, useMemo, useState } from "react";
import style from "./Survey.module.css";
import logo from "../../../../media/svg/lets-iconsquestion-light.svg";
import {
  CaretDownFilled,
  CloseOutlined,
  SearchOutlined,
} from "@ant-design/icons";
import { AutoComplete, notification, Popover, Tooltip } from "antd";
import { useTaskStore } from "../../../../store/taskStore";
import { useFetchFeedback } from "../../../../hooks/useFetchFeedback";
import { useFetchFormsTitle } from "../../../../hooks/useFetchFormsTitle";
import nineIcon from "../../../../media/svg/lets-iconsquestion-light.svg";
import sevenIcon from "../../../../media/svg/healthiconsi-exam-qualification-outline.svg";
import feedbackIcon from "../../../../media/svg/material-symbols-lightfeedback-outline.svg";
// import feedbackIcon from "../../media/svg/material-symbols-lightfeedback-outline.svg";
import { useSelectionsStore } from "../../../../store/selectionStore";
import { useFetchFormsForPicker } from "../../../../hooks/useFetchFormsForPicker";

export type SurveyProps = {
  isFeedback: boolean;
  form?: any;
  isSurvey?: boolean;
  setIsChange?: any;
  locked?: boolean | undefined;
};

const Survey = (props: SurveyProps) => {
  const taskInStore = useTaskStore((state) => state.task);
  const setTaskInStore = useTaskStore((state) => state.addTask);

  const [options, setOptions] = useState<{ value: string | number; key: number; id: number }[]>([]);
  const [inputValue, setInputValue] = useState<string>("");
  const [openPopUp, setOpenPopUp] = useState<boolean>(false);
  const [selectedSurvey, setSelectedSurvey] = useState<any>(null);
  const isFeedback = props.isFeedback;

  const { selectedCourseBatch, selectedCourse, selectedTeam } =
    useSelectionsStore();

  const type = props.isSurvey ? "survey" : "test";
const {
  data: fetchSurvey,
  isSuccess,
  isLoading,
} = isFeedback
  ? useFetchFeedback(
      useMemo(() => selectedCourse?.id ?? 0, [selectedCourse?.id]),
      useMemo(() => selectedTeam?.id ?? 0, [selectedTeam?.id])
    )
  : useFetchFormsForPicker(
      useMemo(() => selectedCourse?.id ?? 0, [selectedCourse?.id]),
      useMemo(() => selectedTeam?.id ?? 0, [selectedTeam?.id]),
      type
    );
  const feedbacks = isFeedback
    ? fetchSurvey?.data
      ?.filter((f: any) => f?.is_active === true)
      ?.map((f: any) => ({
        value: f.name,
        type: "feedback",
        id: f.id,
      }))
    : (fetchSurvey || [])
      .filter((f: any) => f?.is_active === true)
      .map((f: any) => ({
        value: f.title,
        id: f.id,
        type: f.type,
      }));

useEffect(() => {
  const feedbacksList = isFeedback ? fetchSurvey?.data : fetchSurvey;
  
  if (props.form && feedbacks) {
    const formSelected = feedbacksList?.find(
      (i: any) => i?.id === props?.form
    );

    if (formSelected) {
 
      const formSelectedObj = {
        ...formSelected,
        value: formSelected?.title || formSelected?.name,
        type: "test",
      };
      
      // ✅ הוסף תנאי - רק אם הערך שונה
      if (!selectedSurvey || selectedSurvey?.id !== formSelectedObj.id) {
        setSelectedSurvey(formSelectedObj);
      }
    }
  }
}, [props.form, fetchSurvey, selectedSurvey]); 

  useEffect(() => {
    let filteredOptions: { value: string | number; key: number; id: number }[] = [];
    
    if (inputValue == undefined || inputValue.length === 0) {
      filteredOptions =
        feedbacks?.map((e: any) => ({
          value: e.value,
          id: e.id,
          key: e.id,
        })) || [];
    } else {
      filteredOptions = (feedbacks || [])
        .filter((e: any) =>
          String(e.value).toLowerCase().includes(inputValue.toLowerCase())
        )
        .map((e: any) => ({
          value: e.value,
          id: e.id,
          key: e.id,
        }));
    }

    // ✅ הוסף תנאי - רק אם השתנה
    setOptions((prev: typeof filteredOptions) => {
      const prevIds = prev.map((p) => p.id).sort().join(',');
      const newIds = filteredOptions.map((f) => f.id).sort().join(',');
      return prevIds !== newIds ? filteredOptions : prev;
    });
  }, [feedbacks, inputValue]);

  /*   useEffect(() => {
    if (surveyId !== "") {
      setOpenPopUp(false);
      setInputValue("");
      setTaskInStore({ ...taskInStore });
    }
  }, [surveyId]);
 */
  const handleChange = (value: string, option: any) => {
    setInputValue(value);
    if (!option?.id) return;

    useTaskStore.setState((state) => {
      const updatedTask = { ...state.task };

      if (isFeedback) {
        updatedTask.feedbackId = Number(option.id);
      } else if (props.isSurvey) {
        updatedTask.surveyId = Number(option.id);
      } else {
        updatedTask.formId = Number(option.id);
      }

      return { task: updatedTask };
    });
  };

  const handleSelect = (value: string | number) => {
    const selected = feedbacks?.find((survey: any) =>
      String(survey.value) === String(value)
    );
    if (selected) {
      setSelectedSurvey(selected);
      props.setIsChange(true);
      setOpenPopUp(false);
      setInputValue("");
      if (props.isSurvey) {
        setTaskInStore({
          ...taskInStore,
          surveyId: selected.id,
          survey: { id: selected.id, title: selected.value },
        });
      } else {
        if (selected.type === "test") {
          setTaskInStore({
            ...taskInStore,
            formId: selected.id,
            parentForm: { id: selected.id, title: selected.value },
          });
        }
      }
      // option to save here in store the feedbacks
    }
  };
  const removeSurvey = () => {
    setSelectedSurvey(null);
    props.setIsChange(true);
    setTaskInStore({ ...taskInStore, formId: null, Feedback: null });
  };

  const getIconForType = (type: string) => {
    if (type === "test") {
      return (
        <img
          src={sevenIcon}
          style={{
            width: "1rem",
            height: "1rem",
            marginLeft: "4px",
            verticalAlign: "middle",
          }}
        // className={style.svgs}
        />
      );
    }
    if (type === "survey") {
      return (
        <img
          src={nineIcon}
          style={{
            width: "1rem",
            height: "1rem",
            marginLeft: "4px",
            verticalAlign: "middle",
          }}
        // className={style.svgs}
        />
      );
    }
    return null;
  };

  // פונקציה להצגת טקסט מותאם עבור הבחירה הנוכחית
  const getDisplayValue = (survey: any) => {
    if (isFeedback) {
      // {typeof option.value === "string" &&
      //               (option.value.length > 12 ? (
      //                 <Tooltip title={option.value}>
      //                   <span>{option.value.substring(0, 12)}...</span>
      //                 </Tooltip>
      //               ) : (
      //                 <span>{option.value}</span>
      //               ))}
      if (survey.value.length > 12) {
        return (
          <Tooltip title={survey.value}>
            <span>{survey.value.substring(0, 12)}...</span>
          </Tooltip>
        );
      }

      return survey?.value;
    } else {
      return survey?.value.length > 10 ? (
        <>
          <Tooltip title={survey.value}>
            <span>{survey.value.substring(0, 10)}...</span>
          </Tooltip>
          <span style={{ marginRight: "0.3vw" }}>
            {getIconForType(survey.type)}
          </span>
        </>
      ) : (
        <span>
          {survey.value}
          <span style={{ marginRight: "0.3vw" }}>
            {getIconForType(survey.type)}
          </span>
        </span>
      );

      // <span>
      //   {survey.value}
      //   <span style={{ marginRight: "0.3vw" }}>
      //     {getIconForType(survey.type)}
      //   </span>
      // </span>
    }
  };

  return (
    <div
      className={style.wrapper}
      // style={{ cursor: props?.locked ? "not-allowed" : "pointer" }}
      onClick={() => {
        // if (props?.locked) return;
        if (openPopUp) {
          setOpenPopUp(false);
          setInputValue("");
        } else {
          setOpenPopUp(true);
        }
      }}
    >
      <Popover
        open={openPopUp}
        content={
          <AutoComplete
            // disabled={props.locked}
            className={style.select}
            options={options}
            value={inputValue}
            onClick={(e) => e.stopPropagation()}
            onChange={handleChange}
            onSelect={handleSelect}
            placeholder={
              feedbacks?.length === 0 ? (
                <span style={{ color: "#df4552ff" }}>
                  {isFeedback
                    ? "אין משובים..."
                    : !props.isSurvey
                      ? "אין שאלונים..."
                      : "אין סקרים... "}
                </span>
              ) : isFeedback ? (
                "חפש/י משוב..."
              ) : !props.isSurvey ? (
                "חפש/י שאלון..."
              ) : (
                "חפש סקר..."
              )
            }
            suffixIcon={<SearchOutlined />}
            allowClear
            defaultOpen
            optionRender={(option) => {
              const survey = feedbacks?.find(
                (s: any) => s.value === option.value
              );
              if (!survey) return <span>{option.value}</span>;

              return (
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    width: "100%",
                  }}
                >
                  {typeof option.value === "string" &&
                    (option.value.length > 12 ? (
                      <Tooltip title={option.value}>
                        <span>{option.value.substring(0, 12)}...</span>
                      </Tooltip>
                    ) : (
                      <span>{option.value}</span>
                    ))}

                  {survey.type === "test" && (
                    <img
                      src={sevenIcon}
                      style={{
                        width: "1rem",
                        height: "1rem",
                        marginLeft: "4px",
                        verticalAlign: "middle",
                      }}
                      className={style.svgs}
                    />
                  )}
                  {survey.type === "survey" && (
                    <img
                      src={nineIcon}
                      style={{
                        width: "1rem",
                        height: "1rem",
                        marginLeft: "4px",
                        verticalAlign: "middle",
                      }}
                      className={style.svgs}
                    />
                  )}
                </div>
              );
            }}
          />
        }
        placement="bottomRight"
        arrow={false}
      >
        <div className={style.header}>
          <div className={style.text}>
            {isFeedback ? "משוב" : !props.isSurvey ? "שאלון" : "סקר"}
          </div>
          <CaretDownFilled />
        </div>
      </Popover>
      {selectedSurvey && (
        <div style={{ marginRight: "17vw", fontSize: "15px" }}>
          {getDisplayValue(selectedSurvey)}
          <Tooltip
            color="gray"
            title={isFeedback ? "מחיקת משוב" : "מחיקת שאלון"}
          >
            <CloseOutlined
              style={{
                fontSize: "0.7rem",
                backgroundColor: "#ece5d6",
                borderRadius: "50%",
                width: "20px",
                height: "20px",
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
                marginRight: "1vw",
                verticalAlign: "middle",
                cursor: props?.locked ? "not-allowed" : "pointer",
              }}
              onClick={(e) => {
                if (!props?.locked) {
                  e.stopPropagation();
                  removeSurvey();
                }
              }}
              className={style.removeIcon}
            />
          </Tooltip>
        </div>
      )}

      <div className={style.logo}>
        <img
          src={isFeedback ? feedbackIcon : logo}
          style={{ width: "2rem", marginTop: ".5vh" }}
          className={style.svgs}
        />
      </div>
    </div>
  );
};

export default Survey;
