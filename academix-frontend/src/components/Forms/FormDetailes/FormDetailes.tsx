import { useLocation, useNavigate } from "react-router-dom";
import style from "./FormDetailes.module.css";
import { useEffect, useState } from "react";
import { useFetchSameUsersInTeamAndTask } from "../../../hooks/Forms/useFetchSameUsersInTeamAndTask";
import { useSelectionsStore } from "../../../store/selectionStore";
import Notification from "../../../UI/Notification/Notification";
import FormMembers from "../../../utils/FormMembers/FormMembers";
import { useFilteredDataStore } from "../../../store/filteredDataStore";

const FormDetailes = () => {
  const location = useLocation();
  const form = location.state;

  const [users, setUsers] = useState<any>();

  const navigate = useNavigate();

  const {
    selectedTeam,
    selectedTeamMember,
    selectedCourseBatch,
    setSelectedTeamMember,
    setActiveHeaderType,
  } = useSelectionsStore();

  const fetchedUsers = useFetchSameUsersInTeamAndTask(
    Number(form?.task_id),
    Number(selectedTeam?.id),
    selectedCourseBatch.id
  );

  const { filteredTeamMembers } = useFilteredDataStore();

  useEffect(() => {
    if (!form) {
      navigate("/forms", { replace: true });
      return;
    }
  }, [form]);

  useEffect(() => {
    if (fetchedUsers?.data) {
      setUsers(fetchedUsers?.data);
    }
  }, [
    JSON.stringify(fetchedUsers?.data),
    form?.task_id,
    selectedTeam?.id,
    selectedTeamMember,
  ]);

  const handleClick = (userData: any) => {
    console.log(userData);
    console.log(filteredTeamMembers);
    const index = filteredTeamMembers.findIndex(
      (member) => member.id === userData.id
    );

    if (!filteredTeamMembers[index]) {
      Notification({ type: "error", msg: "אנא בחר חבר צוות" });
      return;
    }

    const activeUser = users?.[0]?.data?.users?.find(
      (u: any) => u.id === filteredTeamMembers[index]?.id
    );

    if (!activeUser) {
      Notification({ type: "error", msg: "המשתמש לא נמצא" });
      return;
    }

    const selectedUser = {
      ...activeUser,
      id: filteredTeamMembers[index].id,
    };

    setSelectedTeamMember(selectedUser);
    setActiveHeaderType("teamMember");

    if (selectedUser?.hasSubmission && !selectedUser?.score) {
      navigate(
        `/forms/grading?taskId=${form?.task_id}&teamId=${selectedTeam?.id}`
      );
    } else if (selectedUser?.hasSubmission && selectedUser?.score) {
      navigate(`/forms/show/${selectedUser?.taskAssignmentId}`, {
        state: form,
      });
    } else {
      Notification({
        type: "error",
        msg: "חבר צוות זה אינו ביצע עדיין את המבחן!",
      });
    }
  };

  return (
    <div className={style.mainContainer}>
      <div style={{ marginTop: "2vh" }}>
        <FormMembers
          users={users?.[0]?.data?.users}
          handleClick={handleClick}
        />
      </div>
    </div>
  );
};

export default FormDetailes;
