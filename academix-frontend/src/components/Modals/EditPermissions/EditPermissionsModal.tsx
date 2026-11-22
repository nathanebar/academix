import React, { useEffect, useState } from "react";
import GenericModal from "../GenericModal";
import style from "./EditPermissionsModal.module.css";
import {
  AutoComplete,
  Button,
  ConfigProvider,
  Input,
  notification,
  Select,
} from "antd";
import he_IL from "antd/locale/he_IL";
import { useRoleStore } from "../../../store/roleStore";
import { PermissionsTable } from "../../PermissionsTable/PermissionsTable";
import { OnSearch } from "../../../utils/OnSearch";
import UserPermissionsDiv from "../../../utils/UserPermissionsDiv";
import {
  addTeamMember,
  createRoleAssigment,
  createUser,
  deleteRoleAssigment,
  updateTeamMember,
  deleteTeamMember,
  // getRoles,
} from "../../../services/ApiServices";
import Notification from "../../../UI/Notification/Notification";
import { useSelectionsStore } from "../../../store/selectionStore";
import { usePermissionStore } from "../../../store/permissionStore";
import { useFilteredDataStore } from "../../../store/filteredDataStore";
import { useLocation } from "react-router-dom";
import RegularInput from "../../../UI/Input/Input/RegularInput";
import { useQueryClient } from "@tanstack/react-query";
import { useTeamMembers } from "../../../hooks/useTeamMembers";
import { useAddPermission } from "../../../hooks/useAddPermission";
import { Assignment, Role, ROLE_CODE } from "../../../types/types";

type AddCourseModalProps = {
  isOpen: boolean;
  setIsOpen: (open: boolean) => void;
  course?: string;
  courseBatch?: string;
  user?: any;
  setUser?: any;
  isEditSolider?: boolean;
  setIsEditSolider?: React.Dispatch<React.SetStateAction<boolean>>;
};

const EditPermissionsModal: React.FC<AddCourseModalProps> = ({
  isOpen,
  setIsOpen,
  course,
  courseBatch,
  user,
  setUser,
  isEditSolider,
  setIsEditSolider,
}) => {
  const [results, setResults] = useState<any>([]);
  const [resultsObj, setResultsObj] = useState<any>([]);
  const [searchInputValue, setSearchInputValue] = useState<string>("");
  const [usersList, setUsersList] = useState<any>([]);
  const [role, setRole] = useState<string>();
  const [team, setTeam] = useState<string>();
  const [roles, setRoles] = useState<any[]>([
    {
        "code": "DOMAIN_MANAGER",
        "name_he": "מנהל תחום",
        "name_en": "domain manager",
        "createdAt": "2025-08-17T12:29:30.164Z",
        "updatedAt": "2025-08-17T12:29:30.164Z"
    },
    {
        "code": "COURSE_COMMANDER",
        "name_he": "מפקד קורס",
        "name_en": "course commander",
        "createdAt": "2025-08-17T12:29:30.165Z",
        "updatedAt": "2025-08-17T12:29:30.165Z"
    },
    {
        "code": "TEAM_COMMANDER",
        "name_he": "מפקד צוות",
        "name_en": "team commander",
        "createdAt": "2025-08-17T12:29:30.166Z",
        "updatedAt": "2025-08-17T12:29:30.166Z"
    },
    {
        "code": "STUDENT",
        "name_he": "חניך",
        "name_en": "Student",
        "createdAt": "2025-08-17T12:29:30.168Z",
        "updatedAt": "2025-08-17T12:29:30.168Z"
    },
    {
        "code": "OVERLAP",
        "name_he": "חופף",
        "name_en": "Overlap",
        "createdAt": "2025-08-17T12:29:30.169Z",
        "updatedAt": "2025-08-17T12:29:30.169Z"
    },
    {
        "code": "SYSTEM-ADMIN",
        "name_he": "אדמין-מערכת",
        "name_en": "admin-system",
        "createdAt": "2025-08-17T12:29:30.162Z",
        "updatedAt": "2025-08-17T12:29:30.162Z"
    },
    {
        "code": "DEVELOPER",
        "name_he": "מפתח",
        "name_en": "developer",
        "createdAt": "2025-08-17T12:29:30.169Z",
        "updatedAt": "2025-08-17T12:29:30.169Z"
    }
]);
  const { filteredTeams } = useFilteredDataStore();
  const { selectedPermission, permissions } = usePermissionStore();
  const { selectedCourse, selectedTeam, selectedCourseBatch, selectedDomain } =
    useSelectionsStore();
  const location = useLocation();
  const queryClient = useQueryClient();
  const { addNewPermission, removePermissionById } = useAddPermission();

  useEffect(() => {
    if (user) {
      setIsEditSolider && setIsEditSolider(true);
      setUsersList([user]);
    }
  }, [user]);

  useEffect(() => {
    if (!isOpen) {
      setUsersList([]);
    }
  }, [isOpen]);

/*   useEffect(() => {
    const getRolesList = async () => {
      setRoles(await getRoles());
    };
    getRolesList();
  }, []); */

  useEffect(() => {
    if (currentUrl === "/dashboard/course") {
      setRole("COURSE_COMMANDER");
    }
  });

  const currentUrl = location.pathname;

  const rolesOptions =
    selectedPermission?.role_code === "DOMAIN_MANAGER" ||
    selectedPermission?.role_code === "SYSTEM-ADMIN"
      ? roles
          ?.filter(
            (role) =>
              role.code !== "SYSTEM-ADMIN" &&
              role.code !== "DOMAIN_MANAGER" &&
              role.code !== "DEVELOPER"
          )
          .map((option: any) => ({
            value: option.code,
            label: option.name_he,
          }))
      : selectedPermission?.role_code === "COURSE_COMMANDER"
      ? roles
          .filter(
            (role) =>
              role.code !== "SYSTEM-ADMIN" &&
              role.code !== "DOMAIN_MANAGER" &&
              role.code !== "COURSE_COMMANDER" &&
              role.code !== "DEVELOPER"
          )
          .map((option: any) => ({
            value: option.code,
            label: option.name_he,
          }))
      : roles
          .filter(
            (role) =>
              role.code !== "SYSTEM-ADMIN" &&
              role.code !== "DOMAIN_MANAGER" &&
              role.code !== "COURSE_COMMANDER" &&
              role.code !== "TEAM_COMMANDER" &&
              role.code !== "DEVELOPER"
          )
          .map((option: any) => ({
            value: option.code,
            label: option.name_he,
          }));

  const teamsOptions = filteredTeams.map((option: any) => ({
    value: option.id,
    label: option.name,
  }));

  const addPermissionsUsers = async () => {
    if (usersList.length <= 0) {
      Notification({ type: "error", msg: "נא הוסף אנשים!" });
      return;
    }
    if (!role && !team && currentUrl !== "/dashboard/team") {
      Notification({ type: "error", msg: "נא הכנס צוות ותפקיד!" });
      return;
    }
    if (!role) {
      Notification({ type: "error", msg: "נא הכנס תפקיד!" });
      return;
    }
    if (role.trim() === user?.role?.trim()) {
      Notification({ type: "error", msg: "הרשאה זו קיימת למשתמש זה!" });
      return;
    }
    if (
      !team &&
      role !== "COURSE_COMMANDER" &&
      currentUrl !== "/dashboard/team"
    ) {
      Notification({ type: "error", msg: "נא הכנס צוות!" });
      return;
    }

    if (user && usersList.length > 0) {
      try {
        const teamMemberData = {
          member_role:
            role === "TEAM_COMMANDER"
              ? "TEAM_COMMANDER"
              : role === "OVERLAP"
              ? "OVERLAP"
              : role === "STUDENT"
              ? "STUDENT"
              : "COURSE_COMMANDER",
        };
        const updaingTeamMember = await updateTeamMember(
          currentUrl === "/dashboard/team" ? selectedTeam?.id : team,
          user?.id,
          teamMemberData,
          selectedCourse.id,
          selectedCourseBatch?.id
        );
        if (updaingTeamMember?.status === 201) {
          Notification({
            type: "success",
            msg: "המשתמש עודכן בהצלחה!",
          });
          queryClient.invalidateQueries({
            queryKey: ["teamMembers"],
          });

          if (
            teamMemberData.member_role === "COURSE_COMMANDER" ||
            usersList[0].role === undefined
          ) {
            queryClient.refetchQueries({
              queryKey: ["roleAssignments"],
            });
          }
          setRole(undefined);
          setTeam(undefined);
          setIsOpen(false);
        }
      } catch (error) {
        console.log(error);
      }
    } else {
      try {
        const promises = usersList.map(async (user: any) => {
          const roleAssigmentData = {
            username: user.username,
            role_code: role,
            scope_type: role === "COURSE_COMMANDER" ? "course" : "team",
            scope_id:
              role === "COURSE_COMMANDER"
                ? selectedCourse?.id
                : currentUrl === "/dashboard/team"
                ? selectedTeam?.id
                : team,
            course_id: selectedCourse?.id,
            domain_id: selectedDomain?.id,
          };

          const teamMemberData = {
            username: user.username,
            team_id: currentUrl === "/dashboard/team" ? selectedTeam?.id : team,
            member_role:
              role === "TEAM_COMMANDER"
                ? "TEAM_COMMANDER"
                : role === "OVERLAP"
                ? "OVERLAP"
                : role === "STUDENT"
                ? "STUDENT"
                : "courseCommander",
            course_batch_id: selectedCourseBatch?.id,
            courseID: selectedCourse?.id,
            doamin_id: selectedDomain?.id,
          };

          try {
            await createUser(user);
            let creatingTeamMembers = null;
            if (role !== "COURSE_COMMANDER") {
              creatingTeamMembers = await addTeamMember(teamMemberData);
              if (
                creatingTeamMembers?.status === 409 &&
                creatingTeamMembers.data.error ===
                  "User is already a courseCommander"
              ) {
                Notification({
                  type: "error",
                  msg: "משתמש זה הינו מפקד קורס!",
                });
                return false;
              }
              if (
                creatingTeamMembers?.status === 409 &&
                creatingTeamMembers.data.error ===
                  "User is already DomainManager"
              ) {
                Notification({
                  type: "error",
                  msg: "משתמש זה הינו מנהל תחום!",
                });
                return false;
              }
              if (
                creatingTeamMembers?.status === 409 &&
                creatingTeamMembers.data.error ===
                  "User is already a member of this team"
              ) {
                Notification({
                  type: "error",
                  msg: "משתמש זה כבר קיים בצוות!",
                });
                return false;
              }
            }
            const creatingRoleAssignments = await createRoleAssigment(
              roleAssigmentData
            );
            if (creatingRoleAssignments?.status === 409) {

              Notification({
                type: "error",
                msg: `משתמש זה הינו ${creatingRoleAssignments?.data?.role}!`,
              });
              return false;
            }

            if (
              (creatingTeamMembers?.status === 201 ||
                creatingTeamMembers === null) &&
              creatingRoleAssignments?.status === 201
            ) {
              const newPermission: Assignment = {
                id: creatingRoleAssignments.data.id,
                user_id: user.id || 0,
                role_code: role as ROLE_CODE,
                scope_type: role === "COURSE_COMMANDER" ? "course" : "team",
                scope_id:
                  role === "COURSE_COMMANDER"
                    ? selectedCourse?.id
                    : currentUrl === "/dashboard/team"
                    ? selectedTeam?.id
                    : team,
                scopeName:
                  role === "COURSE_COMMANDER"
                    ? selectedCourse?.name
                    : filteredTeams.find((t: any) => t.id === team)?.name || "",
                role_name:
                  roles.find((r: any) => r.code === role)?.name_he || role,
                allowedTeamIds:
                  role !== "COURSE_COMMANDER"
                    ? [
                        currentUrl === "/dashboard/team"
                          ? selectedTeam?.id
                          : team,
                      ]
                    : [],
                allowedCourseIds:
                  role === "COURSE_COMMANDER" ? [selectedCourse?.id] : [],
                allowedCourseBatcheIds: [],
                allowedAxisIds: [],
                allowedDomainIds: [],
              };

              addNewPermission(newPermission);

              queryClient.invalidateQueries({
                queryKey:
                  role !== "COURSE_COMMANDER"
                    ? ["teamMembers"]
                    : ["roleAssignments"],
              });
              queryClient.refetchQueries({
                queryKey: ["roleAssignments", selectedCourse.id],
              });

              return true;
            }
            return false;
          } catch (error) {
            console.log(error);
            return false;
          }
        });

        const results = await Promise.all(promises);
        const allSuccessful = results.every((result) => result === true);

        if (allSuccessful && usersList.length > 0) {
          notification.success({
            message: "מזל טוב!",
            description: "הרשאות נוספו בהצלחה!",
            duration: 4,
            placement: "top",
            style: { direction: "rtl" },
          });
          setResults([]);
          setUsersList([]);
          setRole(undefined);
          setTeam(undefined);
          setIsOpen(false);
        }
      } catch (error) {
        console.log(error);
      }
    }
  };

  const handleDeleteAssigment = async () => {
    const isTeamCommanderOrOverlap =
      user.role === "TEAM_COMMANDER" || user.role === "OVERLAP";
    const isCourseCommander =
      user.role === "COURSE_COMMANDER" || user.role === undefined;

    try {
      const roleId = isCourseCommander ? selectedCourse?.id : selectedTeam?.id;
      const teamId = selectedTeam?.id;
      const deleteRA = await deleteRoleAssigment(user.id, roleId);
      if (deleteRA.status !== 200) {
        throw new Error("Role assignment deletion failed");
      }

      if (isTeamCommanderOrOverlap) {
        const deleteTm = await deleteTeamMember(teamId, user.id);
        if (deleteTm.status !== 201) {
          throw new Error("Team member deletion failed");
        }
      }

      const permissionToRemove = permissions?.find(
        (p: any) => p.scope_id === roleId && p.role_code === user.role
      );
      if (permissionToRemove) {
        removePermissionById(permissionToRemove.id, true);
      }

      notification.success({
        message: "משתמש נמחק בהצלחה !",
        duration: 4,
        placement: "top",
        style: { direction: "rtl" },
      });

      queryClient.invalidateQueries({
        queryKey: isCourseCommander ? ["roleAssignments"] : ["teamMembers"],
      });
    } catch (error) {
      notification.error({
        message: "שגיאה! משתמש לא נמצא",
        duration: 4,
        placement: "topRight",
        style: { direction: "rtl" },
      });
    } finally {
      setIsOpen(false);
    }
  };

  const HandleOnSearch = async (value: string) => {
    await OnSearch(value, searchInputValue, setResults, setResultsObj);
  };

  const GetUserFromArr = async (input: string) => {
    let username: string;
    const hyphenIndex = input.indexOf("-");
    if (hyphenIndex === -1) {
      username = input;
    } else {
      username = input.substring(0, hyphenIndex);
    }
    try {
      const user = resultsObj.find((r: any) => r?.username === username.trim());
      const userData = {
        name: user.fullName,
        username: user.username,
        militaryid: user.personalNumber,
        basicCourse: user.basicCourse || null,
      };
      const isAlreadyAdded = usersList.some(
        (user: any) => user.name === userData.name
      );
      if (!isAlreadyAdded) {
        setUsersList((prevList: any) => [...prevList, userData]);
      } else {
        notification.error({
          message: "שגיאה!",
          description: "משתמש זה קיים כבר ברשימה!",
          duration: 4,
          placement: "top",
          style: { direction: "rtl" },
        });
      }
      setSearchInputValue("");
      setResults([]);
    } catch (error) {
      console.log(error);
    }
  };

  return (
    <ConfigProvider
      locale={he_IL}
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
            colorBgContainer: "rgba(244, 241, 235, 1)",
            borderRadius: 20,
          },
        },
      }}
    >
      <GenericModal
        isOpen={isOpen}
        setIsOpen={setIsOpen}
        width="34.9vw"
        height={currentUrl !== "/dashboard/course" ? "83.83vh" : "40vh"}
        title={
          currentUrl !== "/dashboard/course"
            ? `${course} / ${courseBatch}`
            : `קורס ${course}`
        }
      >
        <div className={style.mainContainer}>
          <div
            style={{ height: isEditSolider ? "100%" : undefined }}
            className={style.firstDiv}
          >
            <div className={style.editDiv}>
              <h3>
                {currentUrl === "/dashboard/course"
                  ? "עריכת מפקדי קורס"
                  :currentUrl === "/dashboard/team"?`הרשאות ${selectedTeam?.name}`:`הרשאות ${selectedCourseBatch?.name}`}
              </h3>
              {!isEditSolider && (
                <AutoComplete
                  style={{ width: "100%" }}
                  value={searchInputValue}
                  options={results}
                  onSelect={(value) => {
                    setSearchInputValue(value);
                    GetUserFromArr(value);
                  }}
                >
                  <Input.Search
                    placeholder="חפש/י משתמש"
                    allowClear
                    onChange={(e) => {
                      setResults([]);
                      setSearchInputValue(e.target.value);
                    }}
                    onSearch={HandleOnSearch}
                    onKeyDown={(e: any) => {
                      if (e.ctrlKey && (e.key === "k" || e.key === "ל")) {
                        e.preventDefault();
                        HandleOnSearch(e?.target?.value);
                      }
                    }}
                  />
                </AutoComplete>
              )}
              {usersList.length > 0 && (
                <UserPermissionsDiv
                  isEditSolider={isEditSolider}
                  setUser={setUser}
                  user={user}
                  usersList={usersList}
                  setUsersList={setUsersList}
                />
              )}
            </div>
            <br />
            {currentUrl !== "/dashboard/course" && <h4>הגדרת תפקיד</h4>}
            <div className={style.setRolesDiv}>
              {currentUrl !== "/dashboard/course" && (
                <div>
                  <Select
                    placeholder="בחר/י תפקיד"
                    value={role}
                    // here need to chagne the option by the role
                    options={rolesOptions}
                    onSelect={(value) => setRole(value)}
                    onClear={() => setRole(undefined)}
                    style={{ width: "161px", height: "100%" }}
                    allowClear
                  ></Select>
                  {role !== "COURSE_COMMANDER" &&
                    role !== " " &&
                    (currentUrl === "/dashboard/team" ? (
                      <RegularInput
                        value={selectedTeam?.name}
                        setValue={selectedTeam}
                        width="120px"
                        height="110%"
                        marginRight="0.5vw"
                        readonly={true}
                      />
                    ) : (
                      <Select
                        placeholder="בחר/י צוות"
                        value={team}
                        options={teamsOptions}
                        onSelect={(value) => setTeam(value)}
                        onClear={() => setTeam(undefined)}
                        style={{
                          width: "120px",
                          height: "100%",
                          marginRight: "0.5vw",
                        }}
                        allowClear
                      />
                    ))}
                </div>
              )}
              {isEditSolider && (
                <Button
                  style={{ width: "6vw" }}
                  className={style.addButton}
                  onClick={handleDeleteAssigment}
                >
                  {"מחיקת הרשאה"}
                </Button>
              )}
              <Button
                className={style.addButton}
                style={{
                  marginRight: currentUrl === "/dashboard/course" ? "27vw" : 0,
                }}
                onClick={addPermissionsUsers}
              >
                {user && usersList.length > 0 ? "עריכה" : "הוספה +"}
              </Button>
            </div>
          </div>
          {currentUrl !== "/dashboard/course" && (
            <div className={style.secondDiv}>
              <PermissionsTable userID={user?.username} />
            </div>
          )}
        </div>
      </GenericModal>
    </ConfigProvider>
  );
};

export default EditPermissionsModal;
