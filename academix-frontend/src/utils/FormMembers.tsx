import { ConfigProvider, Table } from "antd";
import Photo from "../UI/Photo/Photo";
import { useSelectionsStore } from "../store/selectionStore";
import { useFilteredDataStore } from "../store/filteredDataStore";

type Props = {
  users?: any;
  handleClick: any;
};

const FormMembers = (props: Props) => {
  const { selectedTeam, selectedTeamMember, setSelectedTeamMember } =
    useSelectionsStore();
  const { filteredTeamMembers } = useFilteredDataStore();
  const statusStyle = (record: any) => {
    if (record.score && record.hasSubmission) {
      return {
        color: "rgba(64,179,145,1)",
        backgroundColor: "rgba(231,252,246,1)",
        // border: "1px solid rgba(64,179,145,1)",
        padding: "4px 12px",
        borderRadius: "15px",
        fontWeight: 600,
      };
    } else if (!record.score && record.hasSubmission) {
      return {
        color: "rgba(244,152,51,1)",
        backgroundColor: "rgba(255,247,226,1)",
        // border: "1px solid rgba(244,152,51,1)",
        padding: "4px 12px",
        borderRadius: "15px",
        fontWeight: 600,
      };
    } else {
      return {
        color: "rgba(110,112,114,1)",
        backgroundColor: "rgba(236,229,214,1)",
        // border: "1px solid rgba(110,112,114,1)",
        padding: "4px 12px",
        borderRadius: "15px",
        fontWeight: 600,
      };
    }
  };

  const scoreStyle = (score: number) => {
    if (score) {
      return {
        color:
          score >= 80
            ? "rgba(64,179,145,1)"
            : score >= 65
            ? "rgba(244,152,51,1)"
            : "red",
        backgroundColor:
          score >= 80
            ? "rgba(231,252,246,1)"
            : score >= 65
            ? "rgba(255,247,226,1)"
            : "rgba(255,67,5,0.47)",
        border:
          score >= 80
            ? "1px solid rgba(64,179,145,1)"
            : score >= 65
            ? " 1px solid rgba(244,152,51,1)"
            : " 1px solid red",
        padding: "8px 12px",
        borderRadius: "50%",
        fontWeight: 600,
      };
    }
  };

  const dataSource = props?.users;
  const columns = [
    {
      title: "שם מלא",
      dataIndex: "name",
      key: "name",
      width: 200,
      render: (name: string | undefined, record: any) => (
        <div
          onClick={()=>props?.handleClick(record)}
          style={{
            height: "4vh",
            width: "10vw",
            display: "flex",
            alignItems: "center",
            justifyContent: "start",
            cursor:"pointer"
          }}
        >
          <Photo
            username={
              /* record.militaryid ? record.militaryid :  */ record.username
            }
          />
          <span style={{ marginRight: "1vw", fontWeight: 600 }}>
            {name || record.name}
          </span>
        </div>
      ),
    },
    {
      title: "מספר אישי",
      dataIndex: "militaryId",
      key: "militaryId",
      width: 150,
      render: (militaryId: string | undefined, record: any) => (
        <div style={{ height: "100%", display: "flex", alignItems: "center" }}>
          <span
            style={{
              fontWeight: 600,
            }}
          >
            {militaryId || record.militaryId}
          </span>
        </div>
      ),
    },
   
    {
      title: "סטטוס",
      dataIndex: "",
      key: "",
      width: 150,
      render: (name: string | undefined, record: any) => (
        <div style={{ height: "100%", display: "flex", alignItems: "center" }}>
          <span style={statusStyle(record)}>
            {record.hasSubmission && record.score
              ? "בוצע והוזן ציון"
              : record.hasSubmission && !record.score
              ? "ממתין לציון"
              : "לא בוצע"}
          </span>
        </div>
      ),
    },
    {
      title: "ציון",
      dataIndex: "score",
      key: "score",
      width: 150,
      render: (score: string | undefined, record: any) => (
        <div style={{ height: "100%", display: "flex", alignItems: "center" }}>
          <span style={scoreStyle(record.scorePercentage)}>
            {score || record.score ? score : "אין ציון"}
          </span>
        </div>
      ),
    },
  ];

  return (
    <ConfigProvider
      theme={{
        components: {
          Table: {
            headerColor: "GrayText",
            headerBg: "white",
          },
        },
      }}
    >
      <Table
        sticky
        key={"id"}
        // rowKey={"id"}
        size="middle"
        columns={columns}
        dataSource={dataSource}
        pagination={false}
        virtual={true}
        style={{
          maxHeight: "45vh",
          overflowY: "auto",
          scrollbarWidth: "auto",
          width: "100%",
          borderRadius: "10px",
        }}
      />
    </ConfigProvider>
  );
};

export default FormMembers;
