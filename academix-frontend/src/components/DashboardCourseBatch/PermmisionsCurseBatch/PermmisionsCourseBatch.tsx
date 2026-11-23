import { useState } from "react";
import { ReactComponent as AddIcon } from "../../../media/Group 2.svg";
import { useTeamMembersStore } from "../../../store/teamMemberStore";
import EditPermissionsModal from "../../Modals/EditPermissions/EditPermissionsModal";
import style from "./PermmisionsCourseBatch.module.css";
import Photo from "../../../UI/Photo/Photo";
import { useLocation } from "react-router-dom";
import { useSelectionsStore } from "../../../store/selectionStore";
import { usePermissionStore } from "../../../store/permissionStore";
import { useFetchCourseCommanders } from "../../../hooks/useFetchCourseCommanders";
type PermmisionsCourseBatchProps = {
  height?: string;
};

const PermmisionsCourseBatch: React.FC<PermmisionsCourseBatchProps> = (
  props: PermmisionsCourseBatchProps
) => {
  const { teamMembers } = useTeamMembersStore();
  const { selectedPermission, setSelectedPermission } = usePermissionStore();
  const [modalOpen, setModalOpen] = useState<boolean>(false);
  const [isEditSolider, setIsEditSolider] = useState<boolean>(false);
  const [user, setUser] = useState<any>();
  const {
    selectedTeam,
    selectedCourse,
    selectedCourseBatch,
  } = useSelectionsStore();
  const { data: selectedCourseCommanders } = useFetchCourseCommanders(selectedCourse?.id);
  const location = useLocation();
  const currentUrl = location.pathname;

  const filterdTeamsMembers = teamMembers?.filter(
    (member) => member?.team_id === selectedTeam?.id
  );

  const commanders = filterdTeamsMembers.filter(
    (p) => p.member_role != "STUDENT"
  );

  // Function to handle user click for editing/deleting
  const handleUserClick = (userData: any) => {
    setUser(userData);
    setIsEditSolider(true);
    setModalOpen(true);
  };

  // Function to handle adding new user
  const handleAddNewUser = () => {
    setUser(undefined);
    setIsEditSolider(false);
    setModalOpen(true);
  };
  const switchRoleCheck = (role: string) => {
    switch (role) {
      case "COURSE_COMMANDER":
        return "מפקד/ת קורס";
      case "SYSTEM-ADMIN":
        return "מנהל";
      case "OVERLAP":
        return "חופף/ת";
      case "STUDENT":
        return "חבר/ת צוות";
      case "TEAM_COMMANDER":
        return "מפקד/ת צוות";
      default:
        return "מפקד/ת קורס";
    }
  };
  return (
    <div
      className={
        props.height ? style.propsPermmisionsDiv : style.permmisionsDiv
      }
    >
      <div className={style.permmisionsTitle}>
        <p
          style={{
            fontWeight: 600,
            fontSize: "15px",
            color: "GrayText",
          }}
        >
          הסגל הפיקודי
        </p>
      </div>
      {filterdTeamsMembers.length > 0 ||
      selectedCourseCommanders?.length > 0 ? (
        <div className={style.permmisionsNames}>
          <span>
            מק"ס:{" "}
            <strong>
              {selectedCourseCommanders?.length > 0
                ? selectedCourseCommanders
                    ?.map((p: any) => p.User.name)
                    .join(", ")
                : 'אין מק"ס'}
            </strong>
          </span>
          {currentUrl === "/dashboard/team" ? (
            <span>
              מפ"צ:{" "}
              <strong>
                {filterdTeamsMembers.filter(
                  (p) => p.member_role === "TEAM_COMMANDER" && p.User.name
                ).length > 0
                  ? filterdTeamsMembers
                      .filter(
                        (p) => p.member_role === "TEAM_COMMANDER" && p.User.name
                      )
                      .map((p) => p.User.name)
                      .join(", ")
                  : 'אין מפ"צ'}
              </strong>
            </span>
          ) : null}
          {currentUrl === "/dashboard/team" ? (
            <span>
              חופפים:{" "}
              <strong>
                {filterdTeamsMembers.filter(
                  (p) => p.member_role === "OVERLAP" && p.User.name
                ).length > 0
                  ? filterdTeamsMembers
                      .filter((p) => p.member_role === "OVERLAP" && p.User.name)
                      .map((p) => p.User.name)
                      .join(", ")
                  : "אין חופפים"}
              </strong>
            </span>
          ) : null}
        </div>
      ) : (
        <div>
          <p style={{ fontWeight: 500, marginBottom: "4vh" }}>
            הוסיפו סגל פיקודי לצוות
          </p>
          {/* the plus btn */}
          <AddIcon
            onClick={handleAddNewUser}
            style={{
              marginRight: "33vw",
              marginTop: "2vh",
              height: "2.5rem",
              width: "2.5rem",
              cursor: "pointer",
            }}
          />
        </div>
      )}
     {filterdTeamsMembers.length > 0 ||
      selectedCourseCommanders?.length > 0 ? (
        <div className={style.permmisionsList}>
          <div className={style.permmisionsPhotos}>
            {selectedCourseCommanders?.length
              ? selectedCourseCommanders.map((p: any) =>
                  selectedPermission?.role_code === "COURSE_COMMANDER" ||
                  (currentUrl === "/dashboard/team" &&
                    selectedPermission?.role_code === "TEAM_COMMANDER") ? (
                    <Photo
                      key={p?.User?.id}
                      username={p?.User.username}
                      title={`${
                        p?.User?.name || p?.User?.username
                      } - ${"מפקד קורס"}`}
                    />
                  ) : (
                    <Photo
                      key={p?.User?.id}
                      onClick={() =>
                        handleUserClick({
                          militaryid: p?.User.militaryid,
                          name: p?.User.name,
                          username: p?.User.username,
                          id: p?.User.id,
                          role: p.member_role,
                        })
                      }
                      username={p?.User.username}
                      title={`${
                        p?.User?.name || p?.User?.username
                      } - ${switchRoleCheck(p.member_role)}`}
                    />
                  )
                )
              : ""}
            {currentUrl === "/dashboard/team"
              ? commanders.map((p) =>
                  selectedPermission?.role_code === "TEAM_COMMANDER" ? (
                    <Photo
                      key={p?.User?.id}
                      username={p?.User.username}
                      title={`${
                        p?.User?.name || p?.User?.username
                      } - ${switchRoleCheck(p.member_role)}`}
                    />
                  ) : (
                    <Photo
                      key={p?.User?.id}  // ✅ נוסף!
                      onClick={() =>
                        handleUserClick({
                          militaryid: p?.User.militaryid,
                          name: p?.User.name,
                          username: p?.User.username,
                          id: p?.User.id,
                          role: p.member_role,
                        })
                      }
                      username={p?.User.username}
                      title={`${
                        p?.User?.name || p?.User?.username
                      } - ${switchRoleCheck(p.member_role)}`}
                    />
                  )
                )
              : ""}
          </div>
          {selectedPermission?.role_code === "COURSE_COMMANDER" ||
          selectedPermission?.role_code === "SYSTEM-ADMIN"|| selectedPermission?.role_code === "TEAM_COMMANDER" ? (
            <AddIcon
              onClick={handleAddNewUser}
              style={{
                height: "2.5rem",
                width: "2.5rem",
                cursor: "pointer",
              }}
            />
          ) : (
            ""
          )}
        </div>
      ) : (
        ""
      )}
      <EditPermissionsModal
        isOpen={modalOpen}
        setIsOpen={setModalOpen}
        course={
          currentUrl === "/dashboard/team"
            ? selectedCourseBatch?.name
            : selectedCourse?.name
        }
        courseBatch={
          currentUrl === "/dashboard/team"
            ? selectedTeam?.name
            : selectedCourseBatch?.name
        }
        user={user}
        setUser={setUser}
        isEditSolider={isEditSolider}
        setIsEditSolider={setIsEditSolider}
      />
    </div>
  );
};

export default PermmisionsCourseBatch;
