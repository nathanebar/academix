import { useState, useMemo, useRef } from "react";
import { Button, Input } from "antd";
import { PlusOutlined, SearchOutlined, LeftOutlined } from "@ant-design/icons";
import { feedbackType } from "../../../types/types";
import TempleteFeedback from "./TempleteFeedback/TempleteFeedback";
import style from "./FeedbackDashFilter.module.css";
import FeedBackDashByTeam from "../FeedBackDashByTeam/FeedBackDashByTeam";
import { useNavigate } from "react-router-dom";
import { useSelectionsStore } from "../../../store/selectionStore";

interface FilterProps {
  feedbacks: feedbackType[];
}

const FeedbackDashFilter = (props: FilterProps) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [isSectionOpen, setIsSectionOpen] = useState(false);
  const { selectedTeam, selectedCourseBatch } = useSelectionsStore();

  const batch = selectedCourseBatch ?? {};
  const isTeamIdView = batch.id && selectedTeam ? true : false;

  const navigate = useNavigate();
  // Ref for scrolling to bottom
  const bottomRef = useRef<HTMLDivElement>(null);

  // Scroll to bottom function
  const scrollToBottom = () => {
    setTimeout(() => {
      if (bottomRef.current) {
        bottomRef.current.scrollIntoView({
          behavior: "smooth",
          block: "end",
        });
      } else {
        window.scrollTo({
          top: document.body.scrollHeight,
          behavior: "smooth",
        });
      }
    }, 100); 
  };

  // Handle header click
  const handleHeaderClick = () => {
    const newState = !isSectionOpen;
    setIsSectionOpen(newState);

    // If opening the section, scroll to bottom
    if (newState) {
      scrollToBottom();
    }
  };
  const filteredFeedbacks = useMemo(() => {
    if (!isSectionOpen) return [];

    if (!searchTerm) {
      return props.feedbacks;
    }

    return props.feedbacks.filter((feedback: feedbackType) =>
      feedback.feedbackName?.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [searchTerm, props.feedbacks, isSectionOpen]);

  return (
    <>

      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          padding: "10px 0",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            cursor: "pointer",
          }}
          className={style["headerContainer"]}
          onClick={handleHeaderClick}
        >
          <p style={{ margin: 0 }} className={style["title"]}>
            מאגר תבניות למשוב
          </p>
          <LeftOutlined
            style={{
              marginRight: "10px",
              transform: isSectionOpen ? "rotate(-90deg)" : "rotate(0deg)",
              transition: "transform 0.2s",
            }}
          />
        </div>

        {isSectionOpen && (
          <div className={style["inputBtnDiv"]}>
            <div style={{ paddingLeft: "15px" }}>
              <Button
                className={style["btnClass"]}
                onClick={(e) => {
                  e.stopPropagation();
                  navigate("/feedback/create");
                }}
              >
                תבנית משוב חדשה
                <PlusOutlined />
              </Button>
            </div>
            <Input
              className={style["inputClass"]}
              prefix={<SearchOutlined />}
              placeholder="חפש לפי שם משוב"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        )}
      </div>

      {isSectionOpen && (
        <>
          <div className={style["feedbacksContainer"]}>
            <div className={style["feedbacksWarp"]}>
              {filteredFeedbacks?.map(
                (feedback: feedbackType, index: number) => (
                  <TempleteFeedback
                    allFeedbackInfo={feedback}
                    key={feedback?.feedbackId || index}
                    feedbackTitle={feedback?.feedbackName || ""}
                    category={feedback?.categories?.map(
                      (cat) => cat.categoryName
                    )}
                  />
                )
              )}
            </div>
          </div>
          <div ref={bottomRef} style={{ height: "1px" }} />
        </>
      )}
    </>
  );
};

export default FeedbackDashFilter;
