import { useNavigate } from "react-router-dom";
import { useFilteredDataStore } from "../../store/filteredDataStore";
import { useSelectionsStore } from "../../store/selectionStore";
import { useTeamMembersStore } from "../../store/teamMemberStore";
import CourseMission from "../CourseMission/TeamMission";
import PermmisionsCourseBatch from "../DashboardCourseBatch/PermmisionsCurseBatch/PermmisionsCourseBatch";
import StudentsCourseBatch from "../DashboardCourseBatch/StudentsCourseBatch/StudentsCourseBatch";
import ProgressLevelsCard from "../progressLevelsCard/ProgressLevelsCard";
import style from "./DashboardTeamBody.module.css";
import TeamFeedback from "./TeamFeedback/TeamFeedback";
import { useEffect, useMemo, useState } from "react";
import { useDomainStore } from "../../store/domainStore";
import { useTeamStore } from "../../store/teamStore";
import { useCourseBatchStore } from "../../store/courseBatchStore";
import { useAxesStore } from "../../store/axiStore";
import { filterDataBySelection } from "../../utils/filterUtils";
import { useCourseStore } from "../../store/courseStore";
import TaskException from "../../Exception/TaskException/TaskException";
import ExceptionTeams from "../DashboardCourseBatch/ExceptionTeams/ExceptionTeams";
import {
  Button,
  Modal,
  Empty,
  Input,
  notification,
  ConfigProvider,
} from "antd";
import { useFetchTagsByCourseId } from "../../hooks/useFetchTagsByCourseId";
import TagCard from "../../pages/dashboard/CourseDashboard/TagCard/TagCard";
import {
  COLORS,
  createTag,
  getTeamCompletedTasks,
} from "../../services/ApiServices";
import { queryClient } from "../../api/queryClient";
import CompletedMissions from "../../Exception/completedMissions/CompletedMissions";
import TeamMission from "../CourseMission/TeamMission";
import SoldiersChartComponent from "./SoldiersChartComponent/SoldiersChartComponent";
import FeedbackCategoryChar from "../FeedbackCategoryChar/FeedbackCategoryChar";
import { useFetchFeedbacksByCourseId } from "../../hooks/feedback/useFetchFeedbackByCourseId";
import { BuildOutlined, RocketOutlined } from "@ant-design/icons";

const DashboardTeamBody = () => {
  const { teamMembers } = useTeamMembersStore();
  const { selectedTeam } = useSelectionsStore();
  const teamId = selectedTeam?.id;

  const navigate = useNavigate();

  const { selectedDomain, selectedCourse, selectedCourseBatch } =
    useSelectionsStore();
  const courseBatchId = selectedCourseBatch?.id;

  const filterdTeamsMembers = useMemo(() => {
    return teamMembers?.filter(
      (member) =>
        member?.team_id === selectedTeam?.id &&
        member?.course_batch_id === selectedCourseBatch?.id &&
        member?.member_role === "STUDENT"
    );
  }, [teamMembers, selectedTeam?.id, selectedCourseBatch?.id]);
  const {
    filteredDomains,
    setFilteredDomains,
    filteredCourses,
    setFilteredCourses,
    filteredCourseBatches,
    setFilteredCourseBatches,
    filteredTeams,
    setFilteredTeams,
    setFilteredTeamMembers,
    filteredTeamMembers,
    setFilteredAxis,
  } = useFilteredDataStore();
  const { domains } = useDomainStore();
  const { teams } = useTeamStore();
  const { courses } = useCourseStore();
  const { courseBatches, axisBatchArchive } = useCourseBatchStore();
  const { axes } = useAxesStore();

  const result = filterDataBySelection(
    selectedDomain,
    selectedCourse,
    selectedCourseBatch,
    selectedTeam,
    domains,
    teams,
    courses,
    courseBatches,
    axisBatchArchive,
    axes,
    teamMembers
  );
/*   const {
    data: feedbacks = [],
    isLoading,
    isError,
    error,
  } = useFetchFeedbacksByCourseId(selectedCourse?.id,selectedCourseBatch?.id, teamId); */

  const [openTagModal, setOpenTagModal] = useState<boolean>(false);
  const [openCommandModal, setOpenCommandModal] = useState<boolean>(false);
  const [tags, setTags] = useState<any[]>([]);
  const [tagsInput, setTagsInput] = useState<string>("");
  const fetchedTags = useFetchTagsByCourseId(Number(selectedCourse?.id));
  const [assignmemtData, setAssignmemtData] = useState<any[]>([]);

  useEffect(() => {
    if (fetchedTags?.data) {
      setTags(fetchedTags?.data);
    }
  }, [JSON.stringify(fetchedTags?.data), selectedCourse?.id]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        if (teamId) {
          const response = await getTeamCompletedTasks(teamId, courseBatchId);

          if (response?.success && response.data?.length > 0) {
            const teamData = response.data;
            const assignmentsCompletedWithColor = teamData.map(
              (assignment: any, index: any) => ({
                ...assignment,
                color: COLORS[index % COLORS.length],
                completedTasks:
                  assignment.completedTasks === 0
                    ? 0.1
                    : assignment.completedTasks,
              })
            );

            setAssignmemtData(assignmentsCompletedWithColor);
          }
        }
      } catch (error) {
        console.error("Error:", error);
      }
    };
    fetchData();
  }, [teamId]);

  const handleTagBtnClick = () => setOpenTagModal(true);
  const handleCommandBtnClick = () => setOpenCommandModal(true);
  const handleCloseTagModal = () => setOpenTagModal(false);
  const handleCloseCommandModal = () => setOpenCommandModal(false);
  const handleChangeTagInput = (value: string) => setTagsInput(value);

  const handleAddTag = async () => {
    try {
      if (tagsInput?.trim()?.length === 0) {
        notification.error({
          key: `key-${new Date()}`,
          message: "לא ניתן ליצור תיוג ללא שם!",
          duration: 1,
          placement: "top",
          style: { direction: "rtl" },
        });
        return;
      }
      const tagToSend = {
        name: tagsInput,
        courseid: selectedCourse?.id,
      };
      const res = await createTag(tagToSend);
      if (res?.status === 200) {
        notification.success({
          key: `key-${new Date()}`,
          message: "התיוג נוצר בהצלחה",
          duration: 1,
          placement: "top",
          style: { direction: "rtl" },
        });
        queryClient.refetchQueries({ queryKey: ["tags"] });
        setTagsInput("");
      } else if (res?.status === 401) {
        notification.error({
          key: `key-${new Date()}`,
          message: "קיים כבר תיוג בשם זה!",
          duration: 1,
          placement: "top",
          style: { direction: "rtl" },
        });
      }
    } catch (error) {
      console.log(error);
    }
  };

  const hasData = (arr: unknown[] | undefined) =>
    Array.isArray(arr) && arr.length > 0;

  useEffect(() => {
    if (
      !hasData(result.filteredTeams) &&
      !hasData(result.filteredBatches) &&
      !hasData(result.filteredCourses) &&
      !hasData(result.filteredDomains)
    ) {
      return;
    }
    if (hasData(result.filteredTeams)) {
      navigate("/dashboard/team");
    } else if (hasData(result.filteredBatches)) {
      navigate("/dashboard/courseBatch");
    } else if (hasData(result.filteredCourses)) {
      navigate("/dashboard/course");
    } else if (hasData(result.filteredDomains)) {
      navigate("/dashboard/domain");
    }
  }, [navigate]);


  const styles: { [key: string]: React.CSSProperties } = {
  container: {
    position: "relative",
    minHeight: "100vh",
  },
  pageWrapper: {
    // position: "relative",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    minHeight: "calc(60vh - 80px)",
    // padding: "40px 20px",
    // direction: "rtl",
    // overflow: "hidden",
    
  },
 
  content: {
    position: "relative",
    zIndex: 1,
    textAlign: "center",
    maxWidth: "500px",
  },
  iconContainer: {
    position: "relative",
    display: "inline-block",
    marginBottom: "32px",
  },
  iconCircle: {
    width: "120px",
    height: "120px",
    borderRadius: "50%",
    background: "linear-gradient(135deg, #1890ff 0%, #096dd9 100%)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    boxShadow: "0 12px 40px rgba(24, 144, 255, 0.35)",
  },
  icon: {
    fontSize: "52px",
    color: "#fff",
  },
  iconPulse: {
    position: "absolute",
    top: "50%",
    left: "50%",
    transform: "translate(-50%, -50%)",
    width: "140px",
    height: "140px",
    borderRadius: "50%",
    border: "2px solid #1890ff",
    animation: "pulse 2s ease-out infinite",
  },
  title: {
    fontSize: "64px",
    fontWeight: 800,
    color: "#1a1a2e",
    margin: 0,
    marginBottom: "8px",
    letterSpacing: "-2px",
  },
  subtitle: {
    fontSize: "24px",
    fontWeight: 500,
    color: "#595959",
    margin: 0,
    marginBottom: "24px",
  },
  description: {
    fontSize: "16px",
    color: "#8c8c8c",
    lineHeight: 1.8,
    marginBottom: "32px",
  },
  progressWrapper: {
    marginBottom: "40px",
  },
  progressText: {
    display: "block",
    marginTop: "12px",
    color: "#1890ff",
    fontWeight: 600,
    fontSize: "14px",
  },
  features: {
    display: "flex",
    gap: "16px",
    justifyContent: "center",
    marginBottom: "40px",
    flexWrap: "wrap",
  },
  featureCard: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    gap: "8px",
    padding: "20px 24px",
    background: "#fff",
    borderRadius: "16px",
    boxShadow: "0 4px 20px rgba(0, 0, 0, 0.06)",
    border: "1px solid #f0f0f0",
    minWidth: "120px",
    transition: "all 0.3s ease",
  },
  featureIcon: {
    fontSize: "28px",
    color: "#1890ff",
  },
  button: {
    height: "48px",
    paddingInline: "32px",
    fontSize: "16px",
    fontWeight: 500,
    borderRadius: "24px",
    borderColor: "#1890ff",
    color: "#1890ff",
  },
};
  return (
    <ConfigProvider
      theme={{
        components: {
          Input: {
            hoverBg: "none",
            activeBg: "none",
            colorBgContainer: "rgba(244, 241, 235, 1)",
            activeBorderColor: "none",
            hoverBorderColor: "white",
            borderRadius: 20,
          },
          Select: {
            borderRadius: 100,
            colorBgContainer: "rgba(244,241,235,1)",
          },
        },
      }}
    >
      <div className={style.mainContainer}>
        <div className={style.headerWrapper}>
          <Button className={style.gradeStageBtn} onClick={handleTagBtnClick}>
            תיוגים
          </Button>
          <Button
            className={style.gradeStageBtnCommand}
            onClick={handleCommandBtnClick}
          >
            סגל פיקודי
          </Button>
        </div>

  <StudentsCourseBatch filterdTeamsMembers={filterdTeamsMembers} assignmemtData={assignmemtData}/>

  <div style={styles.pageWrapper}>
      
        <div style={styles.content}>

          <h1 style={styles.title}>בקרוב...</h1>
          <h2 style={styles.subtitle}>עמוד זה בתהליכי פיתוח</h2>


          <p style={styles.description}>
            אנחנו עובדים על מנת להביא לכם חוויה טובה יותר.
            <br />
            העמוד יהיה זמין בקרוב!
          </p>

          <div style={styles.features}>
            <div style={styles.featureCard}>
              <RocketOutlined style={styles.featureIcon} />
              <span>ביצועים משופרים</span>
            </div>
           
            <div style={styles.featureCard}>
              <BuildOutlined style={styles.featureIcon} />
              <span>דוחות מתקדמים</span>
            </div>
          </div>

        </div>
      </div>

        {/* <div className={style.firstDiv}>
          <CompletedMissions assignmemtData={assignmemtData} />
          <ProgressLevelsCard  openTagModal={openTagModal} openCommandModal={openCommandModal}/>
        </div>
        <div className={style.thirdDiv}>
          <div className={style.rightSide}>
            {teamId && <TaskException teamId={teamId} />}
          </div>
          <div className={style.leftSide}>
            <FeedbackCategoryChar feedbacks={feedbacks} />

          
          </div>
          <SoldiersChartComponent teamId={teamId}courseBatchId={courseBatchId}/>
        </div> */}
      
      </div>

      <Modal
        open={openTagModal}
        footer={null}
        onCancel={handleCloseTagModal}
        className={style.gradeStagesModal}
      >
        <p className={style.gradeStagesText}>תיוגים</p>
        <div className={style.addNewGradeStageWrapper}>
          <Input
            className={style.addNewGradeStageInput}
            placeholder="שם תיוג..."
            onPressEnter={handleAddTag}
            value={tagsInput}
            onChange={(e) => handleChangeTagInput(e?.target?.value)}
          />
          <Button onClick={handleAddTag}>הוסף</Button>
        </div>
        <div className={style.existingGradeStagesWrapper}>
          {tags && tags.length > 0 ? (
            tags?.map((tag) => (
              <TagCard id={tag?.id} name={tag?.tagName} key={tag?.id} />
            ))
          ) : (
            <Empty className={style.empty} />
          )}
        </div>
      </Modal>
      <Modal
        open={openCommandModal}
        footer={null}
        onCancel={handleCloseCommandModal}
        width={800}
        style={{ top: 200 }}
      >
        <div style={{ height: "100%", width: "100%" }}>
          <PermmisionsCourseBatch height="90vh" />
        </div>
      </Modal>
    </ConfigProvider>
  );
};
export default DashboardTeamBody;
