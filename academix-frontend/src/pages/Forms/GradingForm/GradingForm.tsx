import { useEffect, useState } from "react";
import style from "./GradingForm.module.css";
import FormBody from "../FormBody/FormBody";

import { useNavigate, useSearchParams } from "react-router-dom";
import { useFetchSameUsersInTeamAndTask } from "../../../hooks/Forms/useFetchSameUsersInTeamAndTask";
import { useSelectionsStore } from "../../../store/selectionStore";
import { User } from "../../../types/types";
import { useFilteredDataStore } from "../../../store/filteredDataStore";
import Photo from "../../../UI/Photo/Photo";
import { Avatar, Button } from "antd";
import { RightOutlined } from "@ant-design/icons";

const GradingForm = () => {
  const [searchParams] = useSearchParams();

  const taskId = searchParams.get("taskId");
  const teamId = searchParams.get("teamId");

  const isSurvey = searchParams.get("isSurvey");



  if (!taskId || !teamId) {
    return <div>NOTHING TO SEE HERE !</div>;
  }

  const [users, setUsers] = useState<any>();
  const [selectedTaskAssignmentId, setSelectedTaskAssignmentId] =
    useState<number>();

  const { selectedTeamMember,selectedCourseBatch } = useSelectionsStore();

  const navigate = useNavigate();


  const fetchedUsers = useFetchSameUsersInTeamAndTask(
    Number(taskId),
    Number(teamId),
    selectedCourseBatch.id,
  );

  
  
  const teamMemberselectName = selectedTeamMember?.name || selectedTeamMember?.User?.name

  
  useEffect(() => {
    if (fetchedUsers?.data) {
    
      setUsers(fetchedUsers?.data);
      setSelectedTaskAssignmentId(
        fetchedUsers?.data?.[0]?.data?.users?.find(
          (user: User) => user.name === teamMemberselectName
        )?.taskAssignmentId
      );
    }
  }, [JSON.stringify(fetchedUsers?.data), taskId, teamId,teamMemberselectName]);

return (
    <>
      <FormBody renderFor="grading" tI={selectedTaskAssignmentId}/>
    </>
  );
};

export default GradingForm;
