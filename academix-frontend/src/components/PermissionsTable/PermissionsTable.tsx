import { ConfigProvider, Table } from "antd";
import style from "./PermissionsTable.module.css";
import { usePermissionStore } from "../../store/permissionStore";
import { useTeamMembersStore } from "../../store/teamMemberStore";
import { useCourseStore } from "../../store/courseStore";
import { useFilteredDataStore } from "../../store/filteredDataStore";
import { useLocation } from "react-router-dom";
import { useSelectionsStore } from "../../store/selectionStore";

type User = {
  id?: string | number;
  name?: string;
  militaryid?: string | number;
  createdAt?: string | Date;
  updatedAt?: string | Date;
  username?: string;
  password?: string;
};

interface props {
  userID?: any;
}

export const PermissionsTable: React.FC<props> = ({ userID }) => {
  const { teamMembers } = useTeamMembersStore();
  const { filteredTeams } = useFilteredDataStore();
  const { selectedTeam, selectedCourseCommanders } = useSelectionsStore();
  const location = useLocation();

  const currentUrl = location.pathname;
  const teamsOptions = filteredTeams.map((option: any) => ({
    text: option.name,
    value: option.id,
  }));

  const dataSource =
    currentUrl === "/dashboard/team"
      ? teamMembers
          .filter(
            (team) =>
              team.team_id === selectedTeam?.id && team.delete_reason === null
          )
          .map((member: any, index: any) => ({
            key: index,
            name: member.User.name,
            username: member.User.username,
            militaryid: member.User.militaryid,
            team: member.Team.name,
            role:
              member.member_role === "TEAM_COMMANDER"
                ? "מפקד צוות"
                : member.member_role === "OVERLAP"
                ? "חופף"
                : member.member_role === "STUDENT"
                ? "חניך"
                : "אחר",
          }))
      : teamMembers
          .filter((team) => team.delete_reason === null)
          .map((member: any, index: any) => ({
            key: index,
            name: member.User.name,
            username: member.User.username,
            militaryid: member.User.militaryid,
            team: member.Team.name,
            role:
              member.member_role === "TEAM_COMMANDER"
                ? "מפקד צוות"
                : member.member_role === "OVERLAP"
                ? "חופף"
                : member.member_role === "STUDENT"
                ? "חניך"
                : "אחר",
          }));

  const columns = [
    {
      title: "שם מלא",
      dataIndex: "name",
      key: "name",
      render: (name: string | undefined, record: User) => (
        <span style={{ fontWeight: 600 }}>{name || record.name}</span>
      ),
    },
    {
      title: "יוזר",
      dataIndex: "username",
      key: "username",
      render: (username: string | undefined, record: User) => (
        <span style={{ fontWeight: 600 }}>{username || record.username}</span>
      ),
    },
    {
      title: "מספר אישי",
      dataIndex: "militaryid",
      key: "militaryid",
      render: (militaryid: string | undefined, record: User) => (
        <span style={{ fontWeight: 600 }}>
          {militaryid || record.militaryid}
        </span>
      ),
    },
    {
      title: "צוות",
      dataIndex: "team",
      key: "team",
      filters: teamsOptions,
      onFilter: (value: any, record: any) =>
        record.team.includes(String(value)),
      render: (team: string | undefined, record: any) => (
        <span style={{ fontWeight: 600 }}>{team || record.team}</span>
      ),
    },
    {
      title: "תפקיד",
      dataIndex: "role",
      key: "role",
      filters: [
        {
          text: "מפקד צוות",
          value: "מפקד צוות",
        },
        {
          text: "חופף",
          value: "חופף",
        },
        {
          text: "חניך",
          value: "חניך",
        },
      ],
      onFilter: (value: any, record: any) =>
        record.role.includes(String(value)),
      render: (role: string | undefined, record: any) => (
        <span style={{ fontWeight: 600 }}>{role || record.role}</span>
      ),
    },
  ];
  return (
    <div>
      <h4 style={{ fontWeight: 200 }}>סגל פיקודי ({dataSource.length})</h4>
      <Table
        rowClassName={(record, index) => {
          // Check if the record has an id property and if it equals 2
          return record.username === userID ? style.row : "";
        }}
        key={"id"}
        rowKey={"id"}
        className={style.table}
        size="middle"
        columns={columns}
        dataSource={dataSource}
        pagination={false}
        style={{
          height: "30vh",
          overflowY: "auto",
          scrollbarWidth: "auto",
        }}
      />
    </div>
  );
};
