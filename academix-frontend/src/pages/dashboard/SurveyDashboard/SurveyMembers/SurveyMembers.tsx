import { ConfigProvider, Table } from "antd";
import { useNavigate } from "react-router-dom";
import Photo from "../../../../UI/Photo/Photo";
import { useSelectionsStore } from "../../../../store/selectionStore";
import { useFilteredDataStore } from "../../../../store/filteredDataStore";
import styles from "./SurveyMembersPage.module.css";

type Props = {
  users?: any[];
  handleClick?: (record: any) => void;
};

const SurveyMembers = (props: Props) => {
  const { selectedTeam } = useSelectionsStore();
  const { filteredTeamMembers } = useFilteredDataStore();

  const statusStyle = (hasResponded: boolean) => {
    if (hasResponded) {
      return {
        color: "rgba(64,179,145,1)",
        backgroundColor: "rgba(231,252,246,1)",
        padding: "4px 12px",
        borderRadius: "15px",
        fontWeight: 600,
      };
    } else {
      return {
        color: "rgba(110,112,114,1)",
        backgroundColor: "rgba(236,229,214,1)",
        padding: "4px 12px",
        borderRadius: "15px",
        fontWeight: 600,
      };
    }
  };

  const columns = [
    {
      title: "שם מלא",
      dataIndex: "name",
      key: "name",
      width: 200,
      render: (name: string | undefined, record: any) => (
        <div
          onClick={() => props?.handleClick && props.handleClick(record)}
          style={{
            height: "4vh",
            width: "10vw",
            display: "flex",
            alignItems: "center",
            justifyContent: "start",
            cursor: props?.handleClick ? "pointer" : "default"
          }}
        >
          <Photo username={record.username} />
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
          <span style={{ fontWeight: 600 }}>
            {militaryId || record.militaryId}
          </span>
        </div>
      ),
    },
    {
      title: "סטטוס",
      dataIndex: "hasResponded",
      key: "hasResponded",
      width: 150,
      render: (hasResponded: boolean | undefined, record: any) => (
        <div style={{ height: "100%", display: "flex", alignItems: "center" }}>
          <span style={statusStyle(record.hasResponded)}>
            {record.hasResponded ? "ענה על הסקר" : "טרם ענה"}
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
        size="middle"
        columns={columns}
        dataSource={props?.users}
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

export default SurveyMembers;