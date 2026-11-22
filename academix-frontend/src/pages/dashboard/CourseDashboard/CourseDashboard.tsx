import { isBusinessConflict } from "../../../utils/httpStatus";
import { HeaderPermissionDisplay } from "../../../components/HeaderPermissionDisplay";
import style from "./CourseDashboard.module.css";
import CourseSetting from "../../../components/CourseSetting/CourseSetting";
import CourseMission from "../../../components/CourseMission/TeamMission";
import CourseBatchList from "../../../components/CourseBatchDiv/CourseBatchList";
import { useFilteredDataStore } from "../../../store/filteredDataStore";
import {
  Button,
  ConfigProvider,
  Empty,
  Input,
  Modal,
  notification,
} from "antd";
import { useEffect, useState } from "react";
import { useFetchGradeStagesByCourseId } from "../../../hooks/useFetchGradeStagesByCourseId";
import { useSelectionsStore } from "../../../store/selectionStore";
import GrdaeStageCard from "./GrdaeStageCard/GrdaeStageCard";
import { createGradeStage, createTag } from "../../../services/ApiServices";
import { queryClient } from "../../../api/queryClient";
import { useDomainStore } from "../../../store/domainStore";
import { useTeamStore } from "../../../store/teamStore";
import { useCourseStore } from "../../../store/courseStore";
import { useCourseBatchStore } from "../../../store/courseBatchStore";
import { useAxesStore } from "../../../store/axiStore";
import { filterDataBySelection } from "../../../utils/filterUtils";
import { useTeamMembersStore } from "../../../store/teamMemberStore";
import { useNavigate } from "react-router-dom";

import { useFetchTagsByCourseId } from "../../../hooks/useFetchTagsByCourseId";
import TagCard from "./TagCard/TagCard";

const CourseDashboard = () => {
  const { filteredAxis, filteredCourseBatches } = useFilteredDataStore();
  const { selectedCourse } = useSelectionsStore();

  const [gradeStages, setGradeStages] = useState<any[]>([]);
  const [gradeStagesInput, setGradeStagesInput] = useState<string>("");

  const [tags, setTags] = useState<any[]>([]);
  const [tagsInput, setTagsInput] = useState<string>("");
  const [openTagModal, setOpenTagModal] = useState<boolean>(false);
  const fetchedGradeStages = useFetchGradeStagesByCourseId(
    Number(selectedCourse?.id)
  );
  const fetchedTags = useFetchTagsByCourseId(Number(selectedCourse?.id));
  const navigate = useNavigate();

  const { teamMembers } = useTeamMembersStore();
  const { domains } = useDomainStore();
  const { teams } = useTeamStore();
  const { courses } = useCourseStore();
  const { courseBatches, axisBatchArchive } = useCourseBatchStore();
  const { axes } = useAxesStore();
  const { selectedDomain, selectedTeam, selectedCourseBatch } =
    useSelectionsStore();

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

  const hasData = (arr: unknown[] | undefined) =>
    Array.isArray(arr) && arr.length > 0;

  useEffect(
    () => {
      if (
        !hasData(result.filteredTeams) &&
        !hasData(result.filteredBatches) &&
        !hasData(result.filteredCourses) &&
        !hasData(result.filteredDomains)
      ) {
        return;
      }

      if (hasData(result.filteredCourses)) {
        navigate("/dashboard/course");
      } else if (hasData(result.filteredDomains)) {
        navigate("/dashboard/domain");
      }
    },
    [
      //   result.filteredDomains?.length,
      // result.filteredCourses?.length,
      // result.filteredBatches?.length,
      // result.filteredTeams?.length,
      // result.filteredTeamMembers?.length,
      //   navigate,
    ]
  );

  useEffect(() => {
    if (fetchedGradeStages?.data) {
      setGradeStages(fetchedGradeStages?.data);
    }
  }, [JSON.stringify(fetchedGradeStages?.data), selectedCourse?.id]);

  useEffect(() => {
    if (fetchedTags?.data) {
      setTags(fetchedTags?.data);
    }
  }, [JSON.stringify(fetchedTags?.data), selectedCourse?.id]);

  const [openGradeStageModal, setOpenGradeStageModal] =
    useState<boolean>(false);

  const handleGradeStageBtnClick: () => void = () => {
    setOpenGradeStageModal(true);
  };

  const handleCloseGradeStageModal: () => void = () => {
    setOpenGradeStageModal(false);
  };
  const handleTagBtnClick: () => void = () => {
    setOpenTagModal(true);
  };

  const handleCloseTagModal: () => void = () => {
    setOpenTagModal(false);
  };
  const handleChangeGradeStageInput: (value: string) => void = (value) => {
    setGradeStagesInput(value);
  };
  const handleChangeTagInput: (value: string) => void = (value) => {
    setTagsInput(value);
  };
  const handleAddGradeStage: () => Promise<void> = async () => {
    try {
      if (gradeStagesInput?.trim()?.length === 0) {
        notification.error({
          key: `key-${new Date()}`,
          message: "לא ניתן ליצור שלב הסמכה ללא שם!",
          duration: 1,
          placement: "top",
          style: { direction: "rtl" },
        });
        return;
      } else {
        const gradeStageToSend = {
          name: gradeStagesInput,
          courseid: selectedCourse?.id,
        };
        const res = await createGradeStage(gradeStageToSend);
        if (res?.status === 200) {
          notification.success({
            key: `key-${new Date()}`,
            message: "שלב ההסמכה נוצר בהצלחה",
            duration: 1,
            placement: "top",
            style: { direction: "rtl" },
          });
          queryClient.invalidateQueries({
            queryKey: ["gradeStages"],
          });
          setGradeStagesInput("");
        } else if (isBusinessConflict(res)) {
          notification.error({
            key: `key-${new Date()}`,
            message: "קיים כבר שלב הסמכה בשם זה בקורס זה!",
            duration: 1,
            placement: "top",
            style: { direction: "rtl" },
          });
        }
      }
    } catch (error) {
      console.log(error);
    }
  };
  const handleAddTag: () => Promise<void> = async () => {
    try {
      if (tagsInput?.trim()?.length === 0) {
        notification.error({
          key: `key-${new Date()}`,
          message: "לא ניתן ליצור שלב הסמכה ללא שם!",
          duration: 1,
          placement: "top",
          style: { direction: "rtl" },
        });
        return;
      } else {
        const tagToSend = {
          name: tagsInput,
          courseid: selectedCourse?.id,
        };
        const res = await createTag(tagToSend);
        if (res?.status === 200) {
          notification.success({
            key: `key-${new Date()}`,
            message: "שלב ההסמכה נוצר בהצלחה",
            duration: 1,
            placement: "top",
            style: { direction: "rtl" },
          });
          queryClient.invalidateQueries({
            queryKey: ["tags"],
          });
          setTagsInput("");
        } else if (isBusinessConflict(res)) {
          notification.error({
            key: `key-${new Date()}`,
            message: "קיים כבר שלב הסמכה בשם זה בקורס זה!",
            duration: 1,
            placement: "top",
            style: { direction: "rtl" },
          });
        }
      }
    } catch (error) {
      console.log(error);
    }
  };
  return (
    <div className={style["container"]}>
      <div className={style["headerWrapper"]}>
        <HeaderPermissionDisplay />

        {/* שינוי: wrapper אחד לשני הכפתורים */}
        <div className={style["buttonsWrapper"]}>
          <Button
            className={style["gradeStageBtn"]}
            onClick={handleTagBtnClick}
          >
            תיוגים
          </Button>
          <Button
            className={style["gradeStageBtn"]}
            onClick={handleGradeStageBtnClick}
          >
            שלבי הסמכה
          </Button>
        </div>
      </div>
      {/* {need design} */}

      {/* {need design} */}
      {filteredAxis?.length === 0 && filteredCourseBatches.length === 0 ? (
        // axes?.length === 0 when every thing is empty and the all box is small
        <div className={style["container1"]}>
          <CourseSetting />
          <div className={style["parent"]}>
            {/* <CourseMission /> */}
            <CourseBatchList />
          </div>
        </div>
      ) : (
        <>
          <div className={style["container2"]}>
            {/* <CourseMission /> */}
            <CourseSetting />
            <CourseBatchList />
          </div>
        </>
      )}
      <Modal
        open={
          openGradeStageModal
          // !
          // true
        }
        footer={null}
        onCancel={handleCloseGradeStageModal}
        className={style["gradeStagesModal"]}
      >
        <p className={style["gradeStagesText"]}>שלבי הסמכה</p>

        <div className={style["addNewGradeStageWrapper"]}>
          <ConfigProvider
            theme={{
              components: {
                Input: {
                  colorBgContainer: "rgb(244, 241, 235)",
                  colorTextPlaceholder: "gray",
                },
              },
            }}
          >
            <Input
              className={style["addNewGradeStageInput"]}
              placeholder="שם שלב ההסמכה..."
              onPressEnter={handleAddGradeStage}
              value={gradeStagesInput}
              onChange={(e) => handleChangeGradeStageInput(e?.target?.value)}
            />
            <Button onClick={handleAddGradeStage}>הוסף</Button>
          </ConfigProvider>
        </div>
        <div className={style["existingGradeStagesWrapper"]}>
          {gradeStages && gradeStages.length > 0 ? (
            gradeStages?.map((gs) => (
              <GrdaeStageCard id={gs?.id} name={gs?.name} key={gs?.id} />
            ))
          ) : (
            <Empty className={style["empty"]} />
          )}
        </div>
      </Modal>
      <Modal
        open={openTagModal}
        footer={null}
        onCancel={handleCloseTagModal}
        className={style["gradeStagesModal"]}
      >
        <p className={style["gradeStagesText"]}>תיוגים</p>

        <div className={style["addNewGradeStageWrapper"]}>
          <ConfigProvider
            theme={{
              components: {
                Input: {
                  colorBgContainer: "rgb(244, 241, 235)",
                  colorTextPlaceholder: "gray",
                },
              },
            }}
          >
            <Input
              className={style["addNewGradeStageInput"]}
              placeholder="שם תיוג..."
              onPressEnter={handleAddTag}
              value={tagsInput}
              onChange={(e) => handleChangeTagInput(e?.target?.value)}
            />
            <Button onClick={handleAddTag}>הוסף</Button>
          </ConfigProvider>
        </div>
        <div className={style["existingGradeStagesWrapper"]}>
          {tags && tags.length > 0 ? (
            tags?.map((gs) => (
              <TagCard id={gs?.id} name={gs?.tagName} key={gs?.id} />
            ))
          ) : (
            <Empty className={style["empty"]} />
          )}
        </div>
      </Modal>
    </div>
  );
};

export default CourseDashboard;
