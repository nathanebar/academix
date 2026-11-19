import { useEffect, useState } from "react";
import { getAllRoleAssigments } from "../../services/ApiServices";
import style from "./RolesAssigmentsBody.module.css";
import RegularInput from "../../UI/Input/Input/RegularInput";
import { SearchOutlined } from "@ant-design/icons";
import { ConfigProvider, Table } from "antd";
import Photo from "../../UI/Photo/Photo";
import { useFetchPermissions } from "../../hooks/useFetchPermissions";

const RolesAssigmentsBody = () => {
  const [rolesAssignments, setRolesAssignments] = useState<any>();
  const [filteredRolesAssignments, setFilteredRolesAssignments] = useState(rolesAssignments);
  const [user, setUser] = useState<string>("");
  const [userId, setUserId] = useState<number>();

  useFetchPermissions(userId);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const data = await getAllRoleAssigments();
        if (data) {
          setRolesAssignments(data);
          setFilteredRolesAssignments(data);
        }
      } catch (error) {
        console.error("Error fetching role assignments:", error);
      }
    };

    fetchData();
  }, []);

  const getHebrewRole = (roleCode: string) => {
    switch (roleCode) {
      case "DEVELOPER":
        return "מפתח";
      case "SYSTEM-ADMIN":
        return "אדמין";
      case "DOMAIN_MANAGER":
        return "מנהל תחום";
      case "COURSE_COMMANDER":
        return "מפקד קורס";
      case "TEAM_COMMANDER":
        return "מפקד צוות";
      case "OVERLAP":
        return "חופף";
      default:
        "חניך";
        return roleCode;
    }
  };

  const dataSource = filteredRolesAssignments?.map((roleAssignment: any) => ({
    id: roleAssignment?.user_id,
    name: roleAssignment?.User.name,
    username: roleAssignment?.User.username,
    role: getHebrewRole(roleAssignment?.role_code),
  }));

  const columns = [
    {
      title: "שם מלא",
      dataIndex: "name",
      key: "name",
      width: 200,
      render: (name: string | undefined, record: any) => (
        <div
          onClick={() => {
            setUserId(record.id);
          }}
          style={{
            height: "4vh",
            width: "10vw",
            display: "flex",
            alignItems: "center",
            justifyContent: "start",
            cursor: "pointer",
          }}
        >
          <Photo username={record?.name} />
          <span style={{ marginRight: "1vw", fontWeight: 600 }}>
            {name || record?.name}
          </span>
        </div>
      ),
    },
    {
      title: "שם משתמש",
      dataIndex: "username",
      key: "username",
      width: 150,
      render: (username: string | undefined, record: any) => (
        <span style={{ fontWeight: 600 }}>{username || record?.username}</span>
      ),
    },
    {
      title: "הרשאה",
      dataIndex: "role",
      key: "role",
      width: 150,
      render: (role: string | undefined, record: any) => (
        <span style={{ fontWeight: 600 }}>{role || record?.role}</span>
      ),
    },
  ];

  useEffect(()=>{
   if (user.trim() === '') {
    setFilteredRolesAssignments(rolesAssignments);
  } else {
    setFilteredRolesAssignments(
      rolesAssignments.filter((f: any) =>
        f?.User?.username?.toLowerCase().includes(user.toLowerCase())
      )
    );
  }
  },[user])

  return (
    <ConfigProvider
      theme={{
        components: {
          Table: {
            rowHoverBg: "rgb(244, 241, 235)",
          },
        },
      }}
    >
      <div className={style.mainDiv}>
        <div className={style.titles}>
          <p
            style={{ color: "GrayText", fontWeight: 600 }}
          >{`משתמשים במערכת (${rolesAssignments?.length})`}</p>
          <RegularInput
            value={user}
            setValue={setUser}
            width="15vw"
            placeholder="חיפוש"
            suffix={<SearchOutlined/>}
          />
        </div>
        <Table
          sticky
          pagination={false}
          key={"id"}
          rowKey={"id"}
          size="small"
          style={{ width: "95%", marginTop: "2vh" }}
          dataSource={dataSource}
          columns={columns}
        />
      </div>
    </ConfigProvider>
  );
};

export default RolesAssigmentsBody;
