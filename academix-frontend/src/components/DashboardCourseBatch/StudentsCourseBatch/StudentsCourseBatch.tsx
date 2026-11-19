import {
  AutoComplete,
  ConfigProvider,
  Input,
  notification,
  Select,
} from "antd";
import BlackButton from "../../../UI/Button/BlackButton";
import StudentsTable from "../../../utils/StudentsTable";
import style from "./StudentsCourseBatch.module.css";
import { useFilteredDataStore } from "../../../store/filteredDataStore";
import { useState } from "react";
import { OnSearch } from "../../../utils/OnSearch";
import Notification from "../../../UI/Notification/Notification";
import {
  addTeamMember,
  createRoleAssigment,
  createUser,
} from "../../../services/ApiServices";
import { useTeamMembersStore } from "../../../store/teamMemberStore";
import { useLocation } from "react-router-dom";
import { useSelectionsStore } from "../../../store/selectionStore";
import { Team, Assignment, ROLE_CODE } from "../../../types/types";
import RegularInput from "../../../UI/Input/Input/RegularInput";
import stringCheckAndToolTip from "../../../utils/stringCheck";
import { useQueryClient } from "@tanstack/react-query";
import { useUserStore } from "../../../store/userStore";
import { useAddPermission } from "../../../hooks/useAddPermission";
import he_IL from "antd/locale/he_IL";

type StudentsCourseBatchProps = {
  height?: string;
  filterdTeamsMembers?: Object[] | undefined;
  assignmemtData?: any;
};

const StudentsCourseBatch = (props: StudentsCourseBatchProps) => {
  const [results, setResults] = useState<any>([]);
  const [resultsObj, setResultsObj] = useState<any>([]);
  const [student, setStudent] = useState<any>({});
  const [studentTeam, setStudentTeam] = useState<string>();
  const [searchInputValue, setSearchInputValue] = useState<string>("");
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [showSearchValidation, setShowSearchValidation] = useState(false);
  const [isUserSelectedFromDropdown, setIsUserSelectedFromDropdown] = useState(false);
  const [showNoResultsValidation, setShowNoResultsValidation] = useState(false);

  const { teamMembers } = useTeamMembersStore();
  const { filteredTeams } = useFilteredDataStore();
  const { selectedTeam, setSelectedTeam, selectedCourseBatch, selectedCourse,selectedDomain } =
    useSelectionsStore();
  const location = useLocation();
  const currentUrl = location.pathname;
  const queryClient = useQueryClient();
 
  const { addNewPermission } = useAddPermission();

  const options =
    currentUrl === "/dashboard/courseBatch"
      ? filteredTeams?.map((team: Team) => ({
        value: team.id,
        label: team.name,
      }))
      : [
        {
          value: selectedTeam?.id,
          label: selectedTeam?.name,
        },
      ];

  const GetUserFromArr = async (input: string) => {
    let username: string;
    const hyphenIndex = input.indexOf("-");
    if (hyphenIndex === -1) {
      username = input;
    } else {
      username = input.substring(0, hyphenIndex);
    }
    try {
      const user = resultsObj?.find(
        (r: any) => r?.username === username.trim()
      );
      const userData = {
        name: user.fullName,
        username: user.username,
        militaryid: user.personalNumber,
        password: "12345",
        basicCourse: user.basicCourse || null,
      };
      setStudent(userData);
      setResults([]);
    } catch (error) {
      console.log(error);
    }
  };

  const HandleOnSearch = async (value: string) => {
    await OnSearch(value, searchInputValue, setResults, setResultsObj, false);
  };

  const clearAllValidation = () => {
    setShowSearchValidation(false);
    setShowNoResultsValidation(false);
  };

  const handleKeyDown = (e: any) => {
    if (e.ctrlKey && (e.key === "k" || e.key === "ל")) {
      e.preventDefault();
      HandleOnSearch(searchInputValue);
      return;
    }
    if (e.key === "Enter") {
      e.preventDefault();
      if (results.length > 0) {
        const firstResult = results[0].value;
        setSearchInputValue(firstResult);
        GetUserFromArr(firstResult);
        setIsUserSelectedFromDropdown(true); 
        setTimeout(() => {
          clearAllValidation();
          addStudent();
        }, 0);
        return;
      }
      const isUserSelected = results.some(
        (r: any) => r.value === searchInputValue
      );
      if (searchInputValue.trim().length > 0 && results.length === 0 && !isUserSelected) {
        setShowNoResultsValidation(true);
        setShowSearchValidation(false);
        return;
      }
      if (isUserSelected || student.username) {
        addStudent();
      }
    }
  };

  const addStudent = async () => {
    if (!isUserSelectedFromDropdown && searchInputValue.trim().length > 0) {
      setShowSearchValidation(true);
      setShowNoResultsValidation(false);
      return;
    }
    if (!searchInputValue && !studentTeam && currentUrl !== "/dashboard/team") {
      Notification({ type: "error", msg: "נא הוסף פרטים!" });
      return;
    }
    if (!searchInputValue || searchInputValue.trim().length === 0) {
      Notification({ type: "error", msg: "נא הוסף חניך!" });
      return;
    }
    if (!studentTeam && currentUrl !== "/dashboard/team") {
      Notification({ type: "error", msg: "נא בחר צוות!" });
      return;
    }
    const roleAssigmentData = {
      username: student.username,
      role_code: "STUDENT",
      scope_type: "team",
      scope_id:
        currentUrl === "/dashboard/team" ? selectedTeam?.id : studentTeam,
      course_id: selectedCourse.id,
      doamin_id:selectedDomain?.id
    };
    const teamMemberData = {
      username: student.username,
      team_id:
        currentUrl === "/dashboard/team" ? selectedTeam?.id : studentTeam,
      member_role: "STUDENT",
      course_batch_id: selectedCourseBatch.id,
      courseID: selectedCourse.id,
        doamin_id:selectedDomain?.id
    };
    try {
      await createUser(student);
      const creatingTeamMembers = await addTeamMember(teamMemberData);
      if (
        creatingTeamMembers?.status === 409 &&
        creatingTeamMembers.data.error === "User is already a courseCommander"
      ) {
        Notification({ type: "error", msg: "משתמש זה הינו מפקד קורס!" });
        return false;
      }
      if (
        creatingTeamMembers?.status === 409 &&
        creatingTeamMembers.data.error === "User is already DomainManager"
      ) {
        Notification({ type: "error", msg: "משתמש זה הינו מנהל תחום!" });
        return false;
      }
      if (
        creatingTeamMembers?.status === 409 &&
        creatingTeamMembers.data.error ===
        "User is already a member of this team"
      ) {
        Notification({ type: "error", msg: "משתמש זה כבר קיים בצוות!" });
        return false;
      }
      const creatingRoleAssignments = await createRoleAssigment(
        roleAssigmentData
      );
      if (
        creatingRoleAssignments?.status === 201 &&
        creatingTeamMembers?.status === 201
      ) {
        const newPermission: Assignment = {
          id: creatingRoleAssignments.data.id,
          user_id: student.id || 0,
          role_code: "STUDENT" as ROLE_CODE,
          scope_type: "team",
          scope_id:
            currentUrl === "/dashboard/team" ? selectedTeam?.id : studentTeam,
          scopeName:
            filteredTeams.find(
              (t: any) =>
                t.id ===
                (currentUrl === "/dashboard/team"
                  ? selectedTeam?.id
                  : studentTeam)
            )?.name || "",
          role_name: "חניך",
          allowedTeamIds: [
            currentUrl === "/dashboard/team" ? selectedTeam?.id : studentTeam,
          ],
          allowedCourseIds: [selectedCourse.id],
          allowedCourseBatcheIds: [],
          allowedAxisIds: [],
          allowedDomainIds: [],
        };
        addNewPermission(newPermission);
        notification.success({
          message: "מזל טוב!",
          description: "חניך נוסף בהצלחה!",
          duration: 4,
          placement: "top",
          style: { direction: "rtl" },
        });
        queryClient.refetchQueries({
          queryKey: ["teamMembers"],
        });
        setResults([]);
        setSearchInputValue("");
        setStudentTeam(undefined);
        setStudent({});
        clearAllValidation();
        setIsUserSelectedFromDropdown(false);
      }
    } catch (error) { }
  };

  const showValidation = showSearchValidation || showNoResultsValidation;
  const validationMessage = "שים לב- עליך לבחור חניך מהרשימה";

  return (
    <ConfigProvider
      locale={he_IL}
      theme={{
        components: {
          Select: {
            borderRadius: 20,
            colorBgContainer: "rgba(244,241,235,1)",
          },
          Input: {
            hoverBg: "none",
            activeBg: "none",
            colorBgContainer: "rgba(244, 241, 235, 1)",
            activeBorderColor: "none",
            hoverBorderColor: "white",
            borderRadius: 20,
            controlHeight: 38,
          },
        },
      }}
    >
      <div
        className={props.height ? style.propsStudentsDiv : style.studentDiv}
        style={
          props.height
            ? {}
            : currentUrl === "/dashboard/team"
              ? { width: "100%", height: "29vh", boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)', }
              : {boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',}
        }
      >
        <div className={style.studentsTitle}>
          <p
            style={{
              fontWeight: 600,
              fontSize: "15px",
              color: "GrayText",
              display: "flex",
              alignItems: "center",
              gap: "8px",
            }}
          >
            {currentUrl === "/dashboard/team" ? "חניכי " : "חיילי "}
            {stringCheckAndToolTip(selectedCourseBatch?.name, 25)}
            <span
              style={{
                padding: "2px 12px",
                backgroundColor: "#fff7e6",
                color: "#fa8c16",
                borderRadius: "10px",
                fontSize: "12px",
                fontWeight: 600,
                border: "1px solid #ffd591",
              }}
            >
              {props.filterdTeamsMembers?.length} חניכים
            </span>
          </p>
          <div
            style={{
              display: "flex",
              width: "75%",
              justifyContent: "space-between",
            }}
          >
            {currentUrl === "/dashboard/team" ? (
              <RegularInput
                value={selectedTeam?.name}
                setValue={setSelectedTeam}
                width="25%"
                height="3.6vh"
                readonly={true}
              />
            ) : (
              <></>
            )}
            {currentUrl === "/dashboard/team" ? (
              <>
                <div style={{
                  width: "50%",
                  display: "flex",
                  flexDirection: "column",
                  position: "relative",
                }}>
                  <div style={{ height: "38px" }}>
                    <AutoComplete
                      style={{ width: "100%" }}
                      options={results}
                      onSelect={(value) => {
                        setSearchInputValue(value);
                        GetUserFromArr(value);
                        setIsUserSelectedFromDropdown(true);
                        setTimeout(() => {
                          clearAllValidation();
                        }, 0);
                      }}
                      onDropdownVisibleChange={(open) =>
                        setIsDropdownOpen(open)
                      }
                      value={searchInputValue}
                    >
                      <Input.Search
                        status={showValidation ? "error" : undefined}
                        placeholder="חפש/י משתמש"
                        allowClear
                        maxLength={50}
                        onChange={(e) => {
                          setResults([]);
                          setSearchInputValue(e.target.value);
                          clearAllValidation();
                          setIsUserSelectedFromDropdown(false);
                        }}
                        onSearch={HandleOnSearch}
                        onKeyDown={handleKeyDown}
                      />
                    </AutoComplete>
                  </div>
                  {showValidation && (
                    <span
                      style={{
                        color: "#ff4d4f",
                        fontSize: "12px",
                        marginTop: "4px",
                        marginRight: "12px",
                        direction: "rtl",
                        position: "absolute",
                        top: "100%",
                        right: 0,
                      }}
                    >
                      {validationMessage}
                    </span>
                  )}
                </div>
                <BlackButton
                  onclickProps={addStudent}
                  width="15%"
                  height="3.6vh"
                >
                  הוספת חניך +
                </BlackButton>
              </>
            ) : (
              ""
            )}
          </div>
        </div>
        <br />
        {teamMembers.length <= 0 ? (
          <p style={{ marginLeft: "46vw" }}>חפשו והוסיפו את החניכים</p>
        ) : (
          <StudentsTable filterdTeamsMembers={props.filterdTeamsMembers} assignmemtData={props.assignmemtData}/>
        )}
      </div>
    </ConfigProvider>
  );
};

export default StudentsCourseBatch;