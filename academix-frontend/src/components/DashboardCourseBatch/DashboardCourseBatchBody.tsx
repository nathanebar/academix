import { isBusinessConflict } from "../../utils/httpStatus";
import { ConfigProvider, Button, Modal, Empty, Input, notification } from "antd";
import style from "./DashboardCourseBatchBody.module.css";
import PermmisionsCourseBatch from "./PermmisionsCurseBatch/PermmisionsCourseBatch";
import TeamCourseBatch from "./TeamsCourseBatch/TeamCourseBatch";
import StudentsCourseBatch from "./StudentsCourseBatch/StudentsCourseBatch";
import CourseMission from "../CourseMission/TeamMission";
import ExceptionTeams from "./ExceptionTeams/ExceptionTeams";
import { useFilteredData } from "../../hooks/useFilteredData";
import { useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { useFetchDomains } from "../../hooks/useFetchDomains";
import { useFetchCourses } from "../../hooks/useFetchCourses";
import { useFetchCourseBatches } from "../../hooks/useFetchCourseBatch";
import { useFetchTeams } from "../../hooks/useFetchTeams";
import { usePermissionStore } from "../../store/permissionStore";
import { useSelectionsStore } from "../../store/selectionStore";
import { filterDataBySelection } from "../../utils/filterUtils";
import AxesMission from "../NewMissions/AxesMission/AxesMission";
import TaskException from "../../Exception/TaskException/TaskException";
import { useFetchTagsByCourseId } from "../../hooks/useFetchTagsByCourseId";
import TagCard from "../../pages/dashboard/CourseDashboard/TagCard/TagCard";
import { createTag } from "../../services/ApiServices";
import { queryClient } from "../../api/queryClient";
import { useAxisBatchArchiveData, useCourseBatchesData, useCoursesData, useDomainsData, useTeamMembersData, useTeamsData } from "../../hooks/useHierarchyData";

const DashboardCourseBatchBody = () => {
  const teamMembers = useTeamMembersData();
  const navigate = useNavigate();
  
  const {
    selectedDomain,
    selectedCourse,
    selectedCourseBatch,
    selectedTeam,
  } = useSelectionsStore();
 
  const filteredTeamsMembers = teamMembers?.filter(
    (member) => 
      member?.course_batch_id === selectedCourseBatch?.id
  );

  const { filteredDomains, filteredCourses, filteredCourseBatches, filteredTeams, filteredTeamMembers } = useFilteredData();
  const domains = useDomainsData();
  const teams = useTeamsData();
  const courses = useCoursesData();
  const courseBatches = useCourseBatchesData();
  const axisBatchArchive = useAxisBatchArchiveData();
  const axes: any[] = []; // the axes store was never filled (#17)
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
  const teamIds: Number[] = result.filteredTeams.map(t => t.id);
  
  // ===== Tags Modal State =====
  const [openTagModal, setOpenTagModal] = useState<boolean>(false);
  const [tags, setTags] = useState<any[]>([]);
  const [tagsInput, setTagsInput] = useState<string>("");
  const fetchedTags = useFetchTagsByCourseId(Number(selectedCourse?.id));
  
  useEffect(() => {
    if (fetchedTags?.data) {
      setTags(fetchedTags?.data);
    }
  }, [JSON.stringify(fetchedTags?.data), selectedCourse?.id]);
  
  const handleTagBtnClick = () => setOpenTagModal(true);
  const handleCloseTagModal = () => setOpenTagModal(false);
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
        queryClient.invalidateQueries({ queryKey: ["tags"] });
        setTagsInput("");
      } else if (isBusinessConflict(res)) {
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
    if (hasData(result.filteredBatches)) {
      navigate("/dashboard/courseBatch");
    } else if (hasData(result.filteredCourses)) {
      navigate("/dashboard/course");
    } else if (hasData(result.filteredDomains)) {
      navigate("/dashboard/domain");
    }
  }, [
    result.filteredDomains?.length,
    result.filteredCourses?.length,
    result.filteredBatches?.length,
    result.filteredTeams?.length,
    result.filteredTeamMembers?.length,
    navigate,
  ]);
  
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
          <Button
            className={style.gradeStageBtn}
            onClick={handleTagBtnClick}
          >
            תיוגים
          </Button>
        </div>
     
        <div className={style.thirdDiv}>
          <ExceptionTeams teams={result.filteredTeams}/>
          <TaskException teamIds={teamIds}/>
        </div>

        <br />
        <div className={style.firstDiv}>
          <div style={{ width: '35%', display: 'flex', flexDirection: "column", gap: "2vh" }}>
            <AxesMission teamIds={teamIds}/>
            <TeamCourseBatch />
          </div>
          <div className={style.secondDiv}>
            <PermmisionsCourseBatch />
            {
              filteredTeamsMembers.length > 0 &&
              <StudentsCourseBatch filterdTeamsMembers={filteredTeamsMembers} />
            }
          </div>
        </div>
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
    </ConfigProvider>
  );
};
export default DashboardCourseBatchBody;