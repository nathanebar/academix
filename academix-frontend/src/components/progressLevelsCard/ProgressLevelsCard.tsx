import React, { useState } from "react";
import styles from "./progressLevelsCard.module.css";
import Slider from "rc-slider";
import "rc-slider/assets/index.css";
import { useFetchGradeStagesByCourseId } from "../../hooks/useFetchGradeStagesByCourseId";
import { useSelectionsStore } from "../../store/selectionStore";
import { useLocation } from "react-router-dom";
import { useFilteredDataStore } from "../../store/filteredDataStore";
import { useFetchCountByGradeStages } from "../../hooks/useFetchCountByGradeStages";
import { Tooltip } from "antd";
import { CaretLeftOutlined, CaretRightOutlined } from "@ant-design/icons";
import InputSearch from "../../UI/Input/InputSearch/InputSearch";
import TeamMission from "../CourseMission/TeamMission";

type Props = {
  style?: React.CSSProperties;
  isGenericGraph?: boolean;
  openTagModal?: boolean;
  openCommandModal?: boolean
};

const SliderWithDots: React.FC<{ percent: number; name: string, openTagModal: boolean, openCommandModal: boolean }> = ({
  percent,
  name,
  openTagModal,
  openCommandModal
}) => {
  const dotCount = 9;

  return (
    <Tooltip title={name} placement="top" open={!openTagModal && !openCommandModal}>
      <div className={styles.sliderWrapper}>
        <div className={styles.dotsContainer}>
          {Array.from({ length: dotCount }, (_, i) => {
            const dotNumber = i + 1;
            const dotPosition = (dotNumber / (dotCount + 1)) * 100;
            const isActive = percent >= dotPosition;

            return (
              <div
                key={i}
                className={styles.dot}
                style={{
                  left: `${dotPosition}%`,
                  backgroundColor: isActive ? "silver" : "white",
                  transform: "translateX(-50%)",
                  transition: "background-color 0.3s ease",
                }}
              />
            );
          })}
        </div>
        <Slider
          min={0}
          max={100}
          step={1}
          value={percent}
          disabled={true}
          style={{padding:0}}
          styles={{
            track: {
              backgroundColor: "#2B2F3E",
              height: 14,
            },
            rail: {
              backgroundColor: "transparent",
              height: 6,
            },
          }}
          handleStyle={{ display: "none" }}
          dotStyle={{ display: "none" }}
        />
      </div>
    </Tooltip>
  );
};

const StageCarousel: React.FC<{
  items: Array<{ id: any; name: string; percent: number }>;
  openTagModal: boolean;
  openCommandModal: boolean
}> = ({ items, openTagModal, openCommandModal }) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [searchValue, setSearchValue] = useState("");

  if (items.length === 0) {
    return <div>אין שלבים</div>;
  }

  const handleSearch = (value: string) => {
    setSearchValue(value);
    if (value.trim()) {
      const foundIndex = items.findIndex((item) =>
        item.name.toLowerCase().includes(value.toLowerCase())
      );
      if (foundIndex !== -1) {
        setCurrentIndex(foundIndex);
      }
    }
  };

  const currentItem = items[currentIndex];

  const handlePrev = () => {
    setCurrentIndex((prev) => (prev === 0 ? items.length - 1 : prev - 1));
  };

  const handleNext = () => {
    setCurrentIndex((prev) => (prev === items.length - 1 ? 0 : prev + 1));
  };

  return (
    <div className={styles.carouselContainer}>
      <div className={styles.arrowButton} onClick={handlePrev}>
        <CaretRightOutlined />
      </div>
      <div className={styles.carouselContent}>
        <div className={styles.stageInfo}>
          <InputSearch
            width="10vw"
            onSearch={handleSearch}
            value={searchValue}
            placeholder="חיפוש"
          />

          <span className={styles.stageHeader}>
            הושלם {currentItem.percent}%
          </span>
        </div>
        <SliderWithDots percent={currentItem.percent} name={currentItem.name} openTagModal={openTagModal} openCommandModal={openCommandModal}/>
        <div className={styles.pagination}>
          {items.length} / {currentIndex + 1}
        </div>
      </div>
      <div className={styles.arrowButton} onClick={handleNext}>
        <CaretLeftOutlined />
      </div>
    </div>
  );
};
type Mode = "certifyProgress" | "axes";
function ProgressLevelsCard({ style, isGenericGraph, openTagModal, openCommandModal }: Props) {
  const [mode, setMode] = useState<Mode>("certifyProgress");
  const { selectedTeam, selectedCourse, selectedCourseBatch } =
    useSelectionsStore();
  const { data: gradeStages, isLoading } = useFetchGradeStagesByCourseId(
    Number(selectedCourse?.id)
  );
  const { pathname } = useLocation();
  const { filteredTeams } = useFilteredDataStore();
  const teamIds = pathname?.includes("dashboard/team")
    ? [selectedTeam?.id]
    : pathname?.includes("dashboard/courseBatch")
    ? filteredTeams?.map((t) => t?.id)
    : pathname?.includes("dashboard/course")
    ? selectedCourse?.id
    : [];
  const { data: gradeStagesCount } = useFetchCountByGradeStages(
    teamIds,
    selectedCourseBatch.id
  );

  const carouselItems =
    gradeStages?.map((item: any) => {
      const relevantPercent =
        gradeStagesCount?.percentByGradeStage?.find(
          (gs: any) => gs?.gradeStageId === item?.id
        )?.percent || 0;

      return {
        id: item.id,
        name: item.name || `שלב ${item.id}`,
        percent: relevantPercent,
      };
    }) || [];

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
         width: "90%", minHeight:"200px",
        marginBottom: "20px",
      }}
    >
      <p
        style={{
          margin: "0",
          fontWeight: 600,
          fontSize: "15px",
          color: "GrayText",
        }}
      ></p>
      <div className={styles.cardContainer} style={style}>
        <div className={styles.cardContent}>
          <div className={styles["headerDiv"]}>
            <div>
              <h3 style={{ color: "#6E7072", fontSize: "20px", margin: 0 }}>
                {mode === "certifyProgress" ? "סרגל התקדמות" : "צירים"}
              </h3>
            </div>

            <div>
              <div className={styles["imporveDiv"]}>
                <div
                  onClick={() => setMode("axes")}
                  className={styles["imporveText"]}
                  style={{
                    backgroundColor: mode === "axes" ? "white" : "",
                    color: mode !== "axes" ? "white" : "",
                  }}
                >
                  צירים
                </div>
                <div
                  onClick={() => setMode("certifyProgress")}
                  className={styles["imporveText"]}
                  style={{
                    backgroundColor: mode === "certifyProgress" ? "white" : "",
                    color: mode !== "certifyProgress" ? "white" : "",
                  }}
                >
                   שלבי הסמכה
                </div>
              </div>
            </div>
          </div>
          {isLoading ? (
            <div className={styles.loadingState}>טוען...</div>
          ) : (
            <>
              {mode === "certifyProgress" && carouselItems.length > 0 ? (
                <StageCarousel items={carouselItems} openTagModal={openTagModal!!} openCommandModal={openCommandModal!!} />
              ) : (
                <TeamMission />
              )}
            </>
          )}
        </div>
        {/* {!isGenericGraph && (gradeStages?.length ?? 0) > 0 && (
          <div className={styles.footer}>
            {gradeStages?.length || 0} שלבי הסמכה
          </div>
        )} */}
      </div>
    </div>
  );
}

export default ProgressLevelsCard;
