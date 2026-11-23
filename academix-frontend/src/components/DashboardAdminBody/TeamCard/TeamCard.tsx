import React, { useState } from "react";
import style from "./TeamCard.module.css";
import Photo from "../../../UI/Photo/Photo";
import { CaretLeftOutlined } from "@ant-design/icons";
import stringCheckAndToolTip from "../../../utils/stringCheck";
import { useTeamMembers } from "../../../hooks/useTeamMembers";
import { useFilteredDataStore } from "../../../store/filteredDataStore";
import { useSelectionsStore } from "../../../store/selectionStore";
import { useNavigate } from "react-router-dom";
import { useSelectionHandler } from "../../../hooks/useSelectionHandler";
import {
  filterBatchesBySelection,
  filterCoursesBySelection,
  filterTeamsByBatch,
} from "../../../utils/filterUtils";
import { useCourseBatchesData, useCoursesData, useTeamsData } from "../../../hooks/useHierarchyData";

interface TeamCardProps {
  teamName: string;
  teamId: number;
  courseBatchId: string | number;
  courseId: string | number;
}

const TeamCard: React.FC<TeamCardProps> = ({
  teamName,
  teamId,
  courseBatchId,
  courseId,
}) => {
  const { teamMembers, loading, error, refetch } = useTeamMembers(
    teamId || null,
    Number(courseBatchId)
  );

  const { setSelectedDomain, setSelectedTeam, setSelectedTeamMember } =
    useSelectionsStore();
  const { setFilteredCourses, setFilteredCourseBatches, setFilteredTeams } =
    useFilteredDataStore();

  const courses = useCoursesData();
  const courseBatches = useCourseBatchesData();
  const teams = useTeamsData();

  const { setSelectedCourseBatch, setSelectedCourse } = useSelectionsStore();
  const [showDropdown, setShowDropdown] = useState(false);

  const navigate = useNavigate();

  const { handleSelectionChange } = useSelectionHandler(
    courses,
    courseBatches,
    teams,
    setSelectedDomain,
    setSelectedCourse,
    setSelectedCourseBatch,
    setSelectedTeam,
    setSelectedTeamMember,
    setFilteredCourses,
    setFilteredCourseBatches,
    setFilteredTeams,
    setShowDropdown,
    filterCoursesBySelection,
    filterBatchesBySelection,
    filterTeamsByBatch
  );

  if (loading) return <div>Loading...</div>;
  if (error) return <div>Error: {error}</div>;

  return (
    <>
      <div className={style["warp"]}>
        <div
          className={style["container"]}
          onClick={() => {
            handleSelectionChange(
              "courseBatches",
              courseBatches.find((item) => item.id === courseBatchId)
            );
            handleSelectionChange(
              "course",
              courses.find((item) => item.id === courseId)
            );
            setSelectedTeam(teams.find((item) => item.id === teamId));
            setSelectedCourseBatch(
              courseBatches.find((item) => item.id === courseBatchId)
            );
            navigate("/dashboard/team");
          }}
        >
          <h3 style={{ paddingRight: "10px", fontWeight: "600" }}>
            {stringCheckAndToolTip(teamName, teamMembers.length < 3 ? 25 : 16)}
          </h3>
         <div className={style["usersDiv"]}>
  {teamMembers.length > 0 ? (
    <>
      {teamMembers
        .filter((tm) => tm.delete_reason === null)
        .slice(0, 3)
        .map((member) => (
          <Photo 
            key={member.User?.username || member.id || Math.random()} 
            username={member.User?.username} 
          />
        ))}
      {teamMembers.length > 3 && (
        <div className={style["teamCount"]}>
          +{teamMembers.length - 3}
        </div>
      )}
    </>
  ) : (
    ""
  )}
</div>
        </div>
        <CaretLeftOutlined
          style={{
            fontSize: "large",
            paddingRight: "5px",
            paddingLeft: "10px",
          }}
        />
      </div>
    </>
  );
};

export default TeamCard;
