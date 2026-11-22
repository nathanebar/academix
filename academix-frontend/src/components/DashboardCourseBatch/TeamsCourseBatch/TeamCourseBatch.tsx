import { CloseOutlined, EllipsisOutlined } from "@ant-design/icons";
import { Dropdown, Input, Menu } from "antd"; // נשאיר Menu לתאימות
import type { MenuProps } from "antd"; // חדש!
import RegularInput from "../../../UI/Input/Input/RegularInput";
import BlackButton from "../../../UI/Button/BlackButton";
import Notification from "../../../UI/Notification/Notification";
import { useState } from "react";
import {
  createTeam,
  deleteTeam,
  updateTeam,
} from "../../../services/ApiServices";
import { useFilteredDataStore } from "../../../store/filteredDataStore";
import { useSelectionsStore } from "../../../store/selectionStore";
import style from "./TeamCourseBatch.module.css";
import { useNavigate } from "react-router-dom";
import { Team } from "../../../types/types";
import { usePermissionStore } from "../../../store/permissionStore";
import stringCheckAndToolTip from "../../../utils/stringCheck";
import { queryClient } from "../../../api/queryClient";

const TeamCourseBatch = () => {
  const [editingTeamId, setEditingTeamId] = useState<any>();
  const [editValue, setEditValue] = useState<string>("");
  const [teamValue, setTeamValue] = useState<string>("");
  const [inputError, setInputError] = useState<boolean>(false);
  const { filteredTeams } = useFilteredDataStore();
  const { selectedCourseBatch, setSelectedTeam, selectedCourse } =
    useSelectionsStore();
  const { selectedPermission, setSelectedPermission } = usePermissionStore();
  const navigate = useNavigate();

  // ===== פונקציה חדשה ליצירת menu items =====
  const getTeamMenuItems = (team: any): MenuProps["items"] => [
    {
      key: "edit",
      label: "שנה שם צוות",
      onClick: () => handleEditTeam(team),
    },
    {
      key: "delete",
      label: "מחק צוות",
      danger: true,
      onClick: async () => {
        const deletingTeam = await deleteTeam(team.id);
        if (deletingTeam.status === 200) {
          Notification({
            type: "success",
            msg: "!מחיקת הצוות בוצעה בהצלחה",
          });
          queryClient.invalidateQueries({
            queryKey: ["teams"],
          });
        }
      },
    },
  ];

  const handleEditTeam = (team: any) => {
    setEditingTeamId(team.id);
    setEditValue(team.name);
  };

  const handleAddTeam = async () => {
    if (teamValue.trim().length === 0 || teamValue.trim().length > 20) {
      Notification({ type: "error", msg: "נא הכנס שם צוות תקין עד 20 תווים" });
      setInputError(true);
      return;
    }
    const teamData = {
      course_batch_id: selectedCourseBatch.id,
      name: teamValue.trim(),
      courseId: selectedCourse?.id,
    };
    try {
      const creatingTeams = await createTeam(teamData);
      if (creatingTeams.status === 409) {
        Notification({ type: "error", msg: "צוות זה קיים כבר!" });
        return;
      }
      if (creatingTeams.status === 201) {
        Notification({ type: "success", msg: "הצוות נוצר בהצלחה!" });
        setTeamValue("");
        setInputError(false);
        const newAllowedTeamIds = [
          ...(selectedPermission?.allowedTeamIds ?? []),
          creatingTeams.data.team.id,
        ];
        setSelectedPermission({
          ...selectedPermission,
          allowedTeamIds: newAllowedTeamIds,
        });
      }
    } catch (error) {
      console.log(error);
    }
  };

  const handleSaveTeam = async (teamId: number | any) => {
    const updateTeamData = {
      id: teamId,
      course_batch_id: selectedCourseBatch.id,
      name: editValue,
    };
    const updatingTeam = await updateTeam(updateTeamData);
    if (updatingTeam.status === 200) {
      Notification({ type: "success", msg: "שם הצוות שונה בהצלחה" });
      const newAllowedCTeamsIds: number[] = [
        ...(selectedPermission?.allowedTeamIds ?? []),
        typeof updateTeamData === "number"
          ? updateTeamData
          : updateTeamData?.id,
      ].filter((id): id is number => typeof id === "number");
      setSelectedPermission({
        ...selectedPermission,
        allowedTeamIds: newAllowedCTeamsIds,
      });
    }
    setEditingTeamId(null);
  };

  return (
    <div className={style.teamsDiv}>
      <div className={style.teamsDivTitle}>
        <p style={{ fontWeight: 600, fontSize: "15px", color: "GrayText" }}>
          צוותים
        </p>
        <div
          style={{
            width: "50%",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <RegularInput
            hasError={inputError ? true : false}
            value={teamValue}
            setValue={setTeamValue}
            placeholder="הזן שם צוות חדש"
            height="3.7vh"
            width="11vw"
            borderColor={inputError ? "red" : "white"}
            onEnterclickProps={handleAddTeam}
          />
          <BlackButton width="6vw" height="3.6vh" onclickProps={handleAddTeam}>
            הוספת צוות +{" "}
          </BlackButton>
        </div>
      </div>
      <br />
      <div className={style.innerTeamsDiv}>
        {filteredTeams.length <= 0 ? (
          <p> הוסיפו צוותים למחזור</p>
        ) : (
          filteredTeams?.map((team, index) => {
            // ===== שינוי: במקום JSX Menu, משתנה items =====
            const menuItems = getTeamMenuItems(team);

            return (
              <div className={style.teamBox} key={team.id ?? index}>
                {editingTeamId === team.id ? (
                  <div
                    style={{
                      display: "flex",
                      flexDirection: "column",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    <CloseOutlined
                      onClick={() => setEditingTeamId(null)}
                      style={{
                        marginRight: "5vw",
                        marginTop: "1vh",
                        fontSize: "1.5vh",
                      }}
                    />
                    <Input
                      value={editValue}
                      onChange={(e) => setEditValue(e.target.value)}
                      onPressEnter={() => handleSaveTeam(team.id)}
                      style={{ width: "90%", marginTop: "3vh" }}
                      autoFocus
                    />
                  </div>
                ) : (
                  <>
                    {/* ===== שינוי: overlay → menu ===== */}
                    <Dropdown 
                      menu={{ items: menuItems }} 
                      trigger={["click"]}
                    >
                      <EllipsisOutlined
                        style={{
                          position: "relative",
                          cursor: "pointer",
                          marginTop: "1vh",
                          marginRight: "5vw",
                          fontSize: "20px",
                        }}
                      />
                    </Dropdown>
                    <div
                      className={style.teamName}
                      onClick={() => {
                        setSelectedTeam(
                          filteredTeams.find(
                            (clickedTeam: Team) =>
                              clickedTeam.name === team.name
                          )
                        );
                        navigate("/dashboard/team");
                      }}
                    >
                      <span
                        style={{
                          fontSize: "16px",
                          marginBottom: "2vh",
                        }}
                      >
                        {stringCheckAndToolTip(team?.name, 15)}{" "}
                      </span>
                    </div>
                  </>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};

export default TeamCourseBatch;