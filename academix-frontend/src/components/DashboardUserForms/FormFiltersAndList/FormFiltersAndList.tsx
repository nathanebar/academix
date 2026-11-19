import React, { useState } from "react";
import { feedbackType, formType } from "../../../types/types";
import FormDiv from "../../../utils/FormDiv/FormDiv";
import style from "./FormFiltersAndList.module.css";
import FeedbackCardByUser from "../../../pages/Feedback/FeedbackDashboardByUser/FeedbackCardByUser/FeedbackCardByUser";
import { ArrowsAltOutlined, ShrinkOutlined } from "@ant-design/icons";
import { Tooltip } from "antd";

interface FormListProps {
  forms?: formType[];
  feedback?: feedbackType[];
  expanded?: boolean;
  onToggleExpand?: () => void;
}

const FormFiltersAndList = (props: FormListProps) => {
  const { expanded: controlledExpanded, onToggleExpand } = props;
  const [internalExpanded, setInternalExpanded] = useState(false);
  const isFeedbackMode = !!props.feedback;

  const displayItems = props.feedback || props.forms || [];
  const title = isFeedbackMode ? "רשימת המשובים" : "רשימת המבחנים";

  const isExpanded = controlledExpanded ?? internalExpanded;

  const toggleExpanded = () => {
    if (onToggleExpand) {
      onToggleExpand();
    } else {
      setInternalExpanded((prev) => !prev);
    }
  };
  const path = location.pathname;

  return (
    <>
      <div
        className={`${style.container} ${
          isExpanded ? style.containerExpanded : ""
        }`}
      >
        <div className={style.header}>
          <h3 className={style.title}>
            {title}
            <span className={style.count}>({displayItems.length})</span>
            {isExpanded && (
              <div
                className={style.backdrop}
                onClick={() => {
                  if (onToggleExpand) {
                    onToggleExpand();
                  } else {
                    setInternalExpanded(false);
                  }
                }}
              />
            )}
            {!path.includes("forms") && (
              <Tooltip title={isExpanded ? "סגור" : "הרחב"}>
                <span style={{ cursor: "pointer" }} onClick={toggleExpanded}>
                  {isExpanded ? <ShrinkOutlined /> : <ArrowsAltOutlined />}
                </span>
              </Tooltip>
            )}
          </h3>
        </div>

        <div className={style.listContainer}>
          {displayItems.length > 0 ? (
            <div
              style={{ maxHeight: controlledExpanded ? "60vh" : "" }}
              className={isFeedbackMode ? style.feedbackList : style.formsList}
            >
              {displayItems.map((item: any, index) => {
                if (isFeedbackMode && "feedbackName" in item) {
                  return (
                    <FeedbackCardByUser
                      key={`${item.feedbackId}-${index}`}
                      feedback={item}
                    />
                  );
                } else {
                  return (
                    <FormDiv
                      key={item.id || item.formId}
                      byUser={true}
                      form={item}
                      status={""}
                    />
                  );
                }
              })}
            </div>
          ) : (
            <div className={style.emptyState}>
              <p>לא נמצאו {isFeedbackMode ? "משובים" : "מבחנים"}</p>
            </div>
          )}
        </div>
      </div>
    </>
  );
};
export default FormFiltersAndList;