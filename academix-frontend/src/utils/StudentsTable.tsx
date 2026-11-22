import { ConfigProvider, Dropdown, Popconfirm, Table, Tooltip } from "antd";
import { MoreOutlined } from "@ant-design/icons";
import Photo from "../UI/Photo/Photo";
import { useFilteredDataStore } from "../store/filteredDataStore";
import { TeamMembers } from "../types/types";
import { useLocation } from "react-router-dom";
import DeleteStudentModal from "../components/Modals/DeleteStudent/DeleteStudentModal";
import { useState } from "react";
import { deleteTeamMember } from "../services/ApiServices";
import Notification from "../UI/Notification/Notification";
import { queryClient } from "../api/queryClient";
import { usePermissionStore } from "../store/permissionStore";
import { useAddPermission } from "../hooks/useAddPermission";
type User = {
  id?: string | number | any;
  name?: string;
  militaryid?: string | number;
  droppingOut?: string | null;
  createdAt?: string | Date;
  updatedAt?: string | Date;
  username?: string;
  password?: string;
  team_id?: number | any;
  delete_reason?: string;
};

interface dataSourceProps {
  filterdTeamsMembers: any | undefined;
  assignmemtData?: any;
}

const StudentsTable: React.FC<dataSourceProps> = ({ filterdTeamsMembers, assignmemtData }) => {

  const mergedData = filterdTeamsMembers.map((member: any) => {
  const assignmentInfo = assignmemtData?.find(
    (item:any) => item.militaryid === Number(member.User.militaryid)
  );

  return {
    ...member,
    lateTasks: assignmentInfo?.lateTasks ?? 0,
    offlineTasksCompleted: assignmentInfo?.offlineTasksCompleted ?? 0,
    averageScore: assignmentInfo?.averageScore ?? '---'
  };
});

  const { filteredTeams } = useFilteredDataStore();

  const [modalOpen, setModalOpen] = useState<boolean>(false);
  const [student, setStudent] = useState<User>({});

  const { removePermissionById } = useAddPermission();
  const location = useLocation();

    const { permissions, selectedPermission } =usePermissionStore();

  const currentUrl = location.pathname;

  const dataSource = mergedData
    ?.filter((member: TeamMembers) => {
      if (currentUrl === "/dashboard/team") {
        return member.member_role === "STUDENT";
      } else if (currentUrl === "/dashboard/courseBatch") {
        return true;
      }
      return true;
    })
    .sort((a: any, b: any) => {
      const aDeleted = a.delete_reason !== null;
      const bDeleted = b.delete_reason !== null;

      if (aDeleted === bDeleted) return 0;

      return aDeleted ? 1 : -1;
    })
    .map((member: any, index: any) => ({
      key: index,
      id: member.User.id,
      name: member.User.name,
      username: member.User.username,
      militaryid: member.User.militaryid,
      droppingOut: member.delete_reason,
      team: member.Team.name,
      team_id: member.team_id,
      delete_reason: member.delete_reason,
      lateTasks: member.lateTasks,
      offlineTasksCompleted: member.offlineTasksCompleted,
      averageScore: member.averageScore,
      role:
        member.member_role === "TEAM_COMMANDER"
          ? "מפקד צוות"
          : member.member_role === "OVERLAP"
          ? "חופף"
          : member.member_role === "STUDENT"
          ? "חניך"
          : "אחר",
    }));

  const filters = filteredTeams?.map((team) => ({
    text: team.name,
    value: team.name,
  }));

  const handleClick = async (record: User, action: string) => {
    if (action === "edit") {
      setStudent(record);
      setModalOpen(true);
    } else {
      const deletingStudent = await deleteTeamMember(
        record?.team_id,
        record?.id
      );
      if (deletingStudent?.status === 201) {
        const permissionToRemove = permissions?.find(
          (p) => p.scope_id === record?.team_id && p.role_code === "STUDENT"
        );
        if (permissionToRemove) {
          removePermissionById(permissionToRemove.id, false);
        }

        Notification({ type: "success", msg: "מחיקת החניך בוצעה בהצלחה!" });
        queryClient.invalidateQueries({
          queryKey: ["teamMembers"],
        });
      }
    }
  };

  const columns = [
    {
      title: "שם מלא",
      dataIndex: "name",
      key: "name",
      width: 200,
      render: (name: string | undefined, record: User) => {
        const content = (
          <div
            style={{
              height: "4vh",
              width: "100%",
              display: "flex",
              alignItems: "center",
              justifyContent: "start",
            }}
          >
            <Photo
              username={record.militaryid ? record.militaryid : record.username}
            />
            <span style={{ marginRight: "1vw", fontWeight: 600 }}>
              {name || record.name}
            </span>
          </div>
        );

        if (record.delete_reason !== null) {
          return <Tooltip title={"חניך זה נשר מהקורס"}>{content}</Tooltip>;
        }

        return content;
      },
    },
    {
      title: "מספר אישי",
      dataIndex: "militaryid",
      key: "militaryid",
      width: 150,

      render: (militaryid: string | undefined, record: User) => (
        <div>
          {" "}
          <span style={{ fontWeight: 600 }}>
            {militaryid || record.militaryid}
          </span>
        </div>
      ),
    },
 {
  title: "משימות פתוחות באיחור",
  dataIndex: "lateTasks", 
  key: "lateTasks",
  width: 150,
  render: (lateTasks: number) => {
    let color = '#52c41a';
    if (lateTasks >= 5) color = '#ff4d4f';
    else if (lateTasks >= 2) color = '#faad14';
    
    return (
      <span style={{ fontWeight: 600, color }}>
        {lateTasks}
      </span>
    );
  },
},
 {
      title: "משימות שהושלמו באופליין",
      dataIndex: "offlineTasksCompleted",
      key: "offlineTasksCompleted",
      width: 150,
      render: (offlineTasksCompleted:number) => (
        <span style={{ fontWeight: 600 }}>{offlineTasksCompleted}</span>
      ),
    },
    {
      title: "צוות",
      dataIndex: "team",
      key: "team",
      width: 150,

      filters: filters,
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
      width: 120,
      render: (role: string | undefined, record: any) => (
        <div style={{ display: "flex", alignItems: "center" }}>
          <span style={{ fontWeight: 600 }}>{role || record.role}</span>
        </div>
      ),
    },
    {
      title: "ממוצע ציונים",
      dataIndex: "averageScore",
      key: "averageScore",
      width: 150,
      render: (averageScore: string | number) => (
        <div style={{ display: "flex", alignItems: "center" }}>
         <span style={{ fontWeight: 600 }}> {averageScore || "לא קיים"}</span>
        </div>
      ),
    },
    {
      title: "נשירה מהקורס",
      dataIndex: "droppingOut",
      key: "droppingOut",
      width: 150,
      render: (droppingOut: string | undefined) => (
        <span
          style={{
            fontWeight: 600,
            color: droppingOut ? "inherit" : "#999",
          }}
        >
          {droppingOut === "LowGrades"
            ? "ציונים נמוכים"
            : droppingOut === "Professionally"
            ? "מקצועיות"
            : droppingOut === "PersonalCompulsions"
            ? "אילוצים אישיים"
            : droppingOut === "PlacementError"
            ? "טעות בשיבוץ"
            : "___"}
        </span>
      ),
    },
   {
  title: "פעולות",
  dataIndex: "deleteUser",
  key: "deleteUser",
  width: 40,
  render: (deleteUser: string | undefined, record: User) => {
    // Check if current user has restricted roles
    const isRestrictedRole =  !(selectedPermission?.role_code !== "STUDENT" && selectedPermission?.role_code !== "OVERLAP" && selectedPermission?.role_code !== "TEAM_COMMANDER")
    
    return (
      <div
        style={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
        }}
      >
        <Dropdown
          disabled={record.delete_reason !== null || isRestrictedRole}
          placement="bottomLeft"
          menu={{
            items: [
              {
                key: "delete",
                label: isRestrictedRole ? (
                  <div style={{ color: "#999" }}>מחיקת חניך</div>
                ) : (
                  <Popconfirm
                    title="האם אתה בטוח שברצונך למחוק את החניך?"
                    description="פעולה זו לא ניתנת לביטול"
                    onConfirm={() => handleClick(record, "delete")}
                    okText="כן, מחק"
                    cancelText="ביטול"
                    placement="left"
                    style={{ marginBottom: "100px" }}
                  >
                    <div style={{ color: "red" }}>מחיקת חניך</div>
                  </Popconfirm>
                ),
                style: { 
                  borderBottom: "1px solid #f0f0f0", 
                  color: isRestrictedRole ? "#999" : "red",
                  cursor: isRestrictedRole ? "not-allowed" : "pointer",
                },
              },
              {
                key: "edit",
                label: "נשירה מחפיפה",
                onClick: () => handleClick(record, "edit"),
                style: { borderBottom: "1px solid #f0f0f0" },
              },
            ],
          }}
          trigger={["click"]}
        >
          <div
            style={{
              fontSize: "x-large",
              cursor: record.delete_reason === null && !isRestrictedRole 
                ? "pointer" 
                : "default",
            }}
          >
            <MoreOutlined rotate={90} />
          </div>
        </Dropdown>
      </div>
    );
  },
},
  ];
  return (
    <ConfigProvider
      theme={{
        components: {
          Table: {
            headerColor: "GrayText",
            rowHoverBg: "none",
          },
        },
      }}
    >
      <Table
        sticky
        key={"id"}
        rowKey={"id"}
        size="small"
        onRow={(record) => ({
          style:
            record.delete_reason !== null
              ? {
                  background: "rgb(195 195 195 / 44%)",
                  color:'#e47474c7'
                }
              : {},
        })}
        columns={
          currentUrl === "/dashboard/team"
            ? columns.filter(
                (column) => column.title !== "צוות" && column.title !== "תפקיד"
              )
            : columns
        }
        dataSource={dataSource}
        pagination={false}
        style={{
          maxHeight: "45vh",
          overflowY: "auto",
          scrollbarWidth: "auto",
          // width: "90%",
        }}
      />
      <DeleteStudentModal
        isOpen={modalOpen}
        setIsOpen={setModalOpen}
        user={student}
      />
    </ConfigProvider>
  );
};

export default StudentsTable;
