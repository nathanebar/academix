import style from "./CourseBatchList.module.css";
import BlackButton from "../../UI/Button/BlackButton";
import { PlusOutlined, SearchOutlined } from "@ant-design/icons";
import { useFilteredData } from "../../hooks/useFilteredData";
import CourseBatchCard from "./CourseBatchCard/CourseBatchCard";
import { Input } from "antd";
import { calculateCourseLenght } from "../../utils/CalculateTime";
import { useState, useMemo } from "react";
import AddCourseBatchesModal from "../Modals/AddCourseBatches/AddCourseBatchesModal";

const CourseBatchList = () => {
  const { filteredCourseBatches, filteredCourses, filteredAxis, filteredTeamMembers } = useFilteredData();

  const [courseBatchModalOpen, setCourseBatchModalOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");

  
  const filteredBatches = useMemo(() => {
    if (!searchTerm) return filteredCourseBatches;
    return filteredCourseBatches.filter((batch) =>
      batch.name.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [filteredCourseBatches, searchTerm]);


  
  return (
    <div
      className={
        filteredAxis.length > 0 || filteredCourseBatches.length > 0
          ? style["haveAxes"]
          : style["card"]
      }
    >
      <div className={style["container"]}>
        <h4
          style={{
            margin: "0",
            marginBottom: "20px",
            paddingRight: "1.5vh",
            fontSize: "18px",
            fontWeight: "bold",
            color: "#6e7072",
          }}
        >
          מחזורי קורס
        </h4>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            width:
              filteredAxis.length > 0 || filteredCourseBatches.length > 0
                ? "30%"
                : "",
          }}
        >
          {(filteredAxis.length > 0 || filteredCourseBatches.length > 0) && (
            <Input
              type="search"
              className={style["search-input"]}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="חיפוש מחזור"
              suffix={<SearchOutlined />}
            />
          )}
          <BlackButton
            height="3.5vh"
            width="6vw"
            onclickProps={() => setCourseBatchModalOpen(!courseBatchModalOpen)}
          >
            <p style={{ margin: "0", fontSize: "0.8rem" }}>מחזור חדש</p>
            <PlusOutlined />
          </BlackButton>
          <AddCourseBatchesModal
            isOpen={courseBatchModalOpen}
            setIsOpen={setCourseBatchModalOpen}
          />
        </div>
      </div>
      {filteredAxis.length > 0 || filteredCourseBatches.length > 0 ? (
        <>
          <div>
            <div className={style["batchListTitles"]}>
              <p key={1} style={{ margin: 0 }}>
                מחזור
              </p>
              <p key={2} style={{ margin: 0 }}>
                תאריכים
              </p>
              <p key={3} style={{ margin: 0 }}>
                צוותים
              </p>
              <p key={4} style={{ margin: 0 }}>
                חניכים
              </p>
              <p key={5} style={{ margin: 0, paddingLeft: "10px" }}>
                סטטוס
              </p>
            </div>
            <div className={style["batchListWarp"]}>
              <p style={{ direction: "rtl" }}>
                {" "}
                {filteredBatches.length === 0
                  ? "אין מחזורים - לחץ להוספת מחזור"
                  : ""}
              </p>
              {filteredBatches?.map((cb, index) => {
                const courseLength = calculateCourseLenght(
                  cb.start_date,
                  filteredCourses[0]?.duration_months
                );
                return (
                  <CourseBatchCard
                    startDate={cb.start_date}
                    cbId={cb.id}
                    courseBatchName={cb.name}
                    courseDates={courseLength}
                    key={cb.id}
                  />
                );
              })}
            </div>
          </div>
        </>
      ) : (
        <p style={{ color: "#6e7072" }}> צרו מחזור חדש לקורס</p>
      )}
    </div>
  );
};
export default CourseBatchList;
