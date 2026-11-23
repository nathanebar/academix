import CardUI from "../../UI/Card/Card";
import { PlusOutlined } from "@ant-design/icons";
import TeamCard from "./TeamCard/TeamCard";
import styles from "./DashboardAdminBody.module.css";
import HeaderCard from "./HeaderCard/HeaderCard";
import { Button } from "antd";
import { useFilteredDataStore } from "../../store/filteredDataStore";
import { useSelectionsStore } from "../../store/selectionStore";
import AddCourseModal from "../Modals/AddCourse/AddCourseModal";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import stringCheckAndToolTip from "../../utils/stringCheck";
import { queryClient } from "../../api/queryClient";
import { useCourseBatchesData, useTeamsData } from "../../hooks/useHierarchyData";

const DashboardAdminBody = () => {
  const teams = useTeamsData();
  const courseBatches = useCourseBatchesData();
  const [courseModalOpen, setCourseModalOpen] = useState<boolean>(false);
  const { filteredCourses, filteredDomains, filteredTeams } = useFilteredDataStore();
  const { setSelectedCourse, setSelectedCourseBatch } = useSelectionsStore();
  const [selectedBatches, setSelectedBatches] = useState<Record<string, string>>({});
  const navigate = useNavigate();

  const handleBatchSelect = (courseId: string, batchName: string) => {
    setSelectedBatches((prev) => ({
      ...prev,
      [courseId]: batchName,
    }));
  };

  return (
    <>
      <div>
        <div className={styles["container"]}>
          {filteredCourses?.map((course, index) => {
            const filterBat = courseBatches?.filter((b) => b.courseId === course.id);
            const latestBatch = filterBat && filterBat.length > 0 ? filterBat[filterBat.length - 1] : null;
            const selectedBatchForCourse = selectedBatches[course.id];
            const currentBatch = selectedBatchForCourse
              ? filterBat?.find((b) => b.name === selectedBatchForCourse)
              : latestBatch;

            // ✅ תיקון: סינון לפי הטבלה החדשה
            const teamsInBatchs = teams?.filter((team:any) => {
              // בדיקה אם יש קישורים למחזור הנוכחי
              const hasBatch = team.courseBatches?.some(
                (cb:any) => cb.course_batch_id === currentBatch?.id
              );
              return hasBatch;
            });

            return (
              <div key={index} style={{ flex: "0 0 auto", minWidth: "15vw" }}>
                <h5
                  style={{ textWrap: "nowrap" }}
                  onClick={() => {
                    setSelectedCourse(course);
                    if (course?.id) {
                      queryClient.invalidateQueries({
                        queryKey: ["roleAssignments", course.id],
                      });
                    }
                    setSelectedCourseBatch(
                      courseBatches?.filter((cd) => cd.courseId === course.id)[0]
                    );
                    navigate("/dashboard/course");
                  }}
                  className={styles["allBatches"]}
                >
                  {stringCheckAndToolTip(course.name, 25)} - כל המחזורים
                </h5>

                <CardUI
                  bodyStyle={{ padding: "0" }}
                  height=""
                  width="18vw"
                  title={
                    <HeaderCard
                      course={course?.name}
                      courseBatch={currentBatch}
                      startTime={currentBatch?.start_date as Date}
                      courseLenght={course?.duration_months}
                      courseId={course.id as string}
                      onBatchSelect={handleBatchSelect}
                      selectedBatch={selectedBatchForCourse || latestBatch?.name || ""}
                    />
                  }
                  children={
                    <>
                      <div className={styles["cardContainer"]}>
                        <div
                          style={{
                            overflow: "auto",
                            direction: "ltr",
                            paddingRight: "5px",
                            paddingLeft: "1vw",
                          }}
                        >
                          {teamsInBatchs && teamsInBatchs.length > 0 ? (
                            teamsInBatchs.map((team, idx) => (
                              <TeamCard
                                key={team.id}
                                teamName={team?.name}
                                teamId={team.id as number}
                                courseBatchId={currentBatch?.id || ""}
                                courseId={course?.id}
                              />
                            ))
                          ) : (
                            <span style={{ padding: "10px", color: "#999" }}>
                              אין צוותים במחזור זה
                            </span>
                          )}
                        </div>
                      </div>
                    </>
                  }
                />
              </div>
            );
          })}

          <div style={{ flex: "0 0 auto", minWidth: "15vw" }}>
            {filteredDomains.length > 0 ? (
              <div className={styles["addCoursDiv"]}>
                <Button
                  className={styles["addCoursBtn"]}
                  onClick={() => setCourseModalOpen(!courseModalOpen)}
                  icon={<PlusOutlined />}
                >
                  <span style={{ fontWeight: "600" }}>הוספת קורס חדש</span>
                </Button>
              </div>
            ) : (
              <div>עליך ליצור תחומים</div>
            )}
          </div>
        </div>
      </div>

      <AddCourseModal isOpen={courseModalOpen} setIsOpen={setCourseModalOpen} />
    </>
  );
};

export default DashboardAdminBody;