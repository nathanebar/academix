import { MoreOutlined } from "@ant-design/icons";
import { Dropdown, Popconfirm, Progress } from "antd";
import style from "./CourseBatchCard.module.css";
import { useTeamStore } from "../../../store/teamStore";
import { parseEndDateFromRange } from "../../../utils/CalculateTime";
import { useNavigate } from "react-router-dom";
import { useSelectionsStore } from "../../../store/selectionStore";
import { useFilteredDataStore } from "../../../store/filteredDataStore";
import stringCheckAndToolTip from "../../../utils/stringCheck";
import {
  deleteCourseBatch,
  getMemberByBatchId,
} from "../../../services/ApiServices";
import Notification from "../../../UI/Notification/Notification";
import AddCourseBatchesModal from "../../Modals/AddCourseBatches/AddCourseBatchesModal";
import { useEffect, useState } from "react";
import { usePermissionStore } from "../../../store/permissionStore";
import { useTeamMembersStore } from "../../../store/teamMemberStore";
import { useAddPermission } from "../../../hooks/useAddPermission";
import { TeamWithBatches } from "../../../types/types";

type Props = {
  courseBatchName: string;
  courseDates: any;
  cbId: number | string;
  startDate: Date;
};

const CourseBatchCard = (props: Props) => {
  const { teams } = useTeamStore();

  

 const teamsCount = teams.filter((team:TeamWithBatches) => {
 
  const hasBatch = team.courseBatches?.some(
    (cb) => cb.course_batch_id === props.cbId
  );
  return hasBatch;
});



  const navigate = useNavigate();
  const { setSelectedCourseBatch } = useSelectionsStore();
  const { filteredCourseBatches } = useFilteredDataStore();
  const [courseBatchModalOpen, setCourseBatchModalOpen] = useState<boolean>(false);
  const { selectedPermission, setSelectedPermission, permissions } = usePermissionStore();
  const [count, setCount] = useState<number | null>(null);
  const { removePermissionById } = useAddPermission();

  useEffect(() => {
    const fetchCount = async () => {
      try {
        const countMembers = await getMemberByBatchId(Number(props.cbId));
        setCount(countMembers.count);
      } catch (err) {
        console.error("Failed to fetch member count", err);
      }
    };
    fetchCount();
  }, [props.cbId]);

  const handleActionClick = async (action: string, cbID: string | number) => {
    if (action === "delete") {
      const deletingCourseBatch = await deleteCourseBatch(cbID);
      
      if (deletingCourseBatch.status === 200) {
        const permissionToRemove = permissions?.find(
          (p: any) => p.scope_id === cbID
        );
        if (permissionToRemove) {
          removePermissionById(permissionToRemove.id, true);
        }

        const newAllowedCourseBatcheIdsIds =
          selectedPermission?.allowedCourseBatcheIds?.filter(
            (cb: any) => cb !== cbID
          );
        setSelectedPermission({
          ...selectedPermission,
          allowedCourseBatcheIds: newAllowedCourseBatcheIdsIds,
        });
        
        Notification({ type: "success", msg: "מחיקת המחזור בוצעה בהצלחה!" });
        return;
      }
      Notification({ type: "error", msg: "!ישנה שגיאה במחיקת המחזור" });
    }
    if (action === "edit") {
      setCourseBatchModalOpen(true);
    }
  };

  const endDate = parseEndDateFromRange(props.courseDates);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const startDate = new Date(props.startDate);
  startDate.setHours(0, 0, 0, 0);
  const endDateTime = new Date(endDate);
  endDateTime.setHours(0, 0, 0, 0);

  let progressStatus = "טרם התחיל";
  let progressPercent = 0;
  if (today >= startDate) {
    progressStatus = "בתהליך";
    const totalDuration = endDateTime.getTime() - startDate.getTime();
    const daysPassed = Math.floor(
      (today.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)
    );
    const totalDays = Math.ceil(totalDuration / (1000 * 60 * 60 * 24));
    if (totalDays > 0) {
      progressPercent = Math.min(
        100,
        Math.max(0, (daysPassed / totalDays) * 100)
      );
    }
    if (today > endDateTime) {
      progressStatus = "הסתיים";
      progressPercent = 100;
    }
  }

  return (
    <div
      style={{
        background: "#f4f1eb",
        marginBottom: "16px",
        height: "5vh",
        alignContent: "center",
        borderRadius: "10px",
        direction: "rtl",
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
      }}
    >
      <div
        style={{
          display: "flex",
          width: "95%",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        <div style={{ paddingRight: "10px", width: "10vw" }}>
          <p
            style={{ fontWeight: "bold", color: "#6e7072", cursor: "pointer" }}
            onClick={() => {
              setSelectedCourseBatch(
                filteredCourseBatches.find(
                  (item) => item.name === props.courseBatchName
                )
              );
              navigate("/dashboard/courseBatch");
            }}
          >
            {stringCheckAndToolTip(props.courseBatchName, 20)}{" "}
          </p>
        </div>
        <div style={{ width: "15vw" }}>
          <p>{props.courseDates}</p>
        </div>
        <div style={{ width: "6vw", paddingLeft: "6vw" }}>
          <p>{teamsCount.length}</p>
        </div>
        <div style={{ width: "6vw", paddingLeft: "1vw" }}>
          <p>{count}</p>
        </div>
        <div
          style={{
            display: "flex",
            width: "14vw",
            justifyContent: "space-between",
          }}
        >
          <p style={{ margin: "0" }}>{progressStatus}</p>
          <Progress
            className={style["prog"]}
            showInfo={false}
            strokeWidth={25}
            strokeColor={"rgb(37, 199, 37)"}
            percent={progressPercent}
            steps={10}
          />
        </div>
      </div>
      <Dropdown
        placement="topRight"
        menu={{
          items: [
            {
              key: "delete",
              label: (
                <Popconfirm
                  title="האם אתה בטוח שברצונך למחוק את קורס?"
                  description="פעולה זו לא ניתנת לביטול"
                  onConfirm={() => handleActionClick("delete", props.cbId)}
                  okText="כן, מחק"
                  cancelText="ביטול"
                  placement="bottom"
                >
                  <div style={{ color: "red" }}>מחיקה</div>
                </Popconfirm>
              ),
              style: { borderBottom: "1px solid #f0f0f0" },
            },
            {
              key: "editRoles",
              label: "עריכת מחזור",
              onClick: () => handleActionClick("edit", props.courseBatchName),
              style: { borderBottom: "1px solid #f0f0f0" },
            },
          ],
        }}
        trigger={["click"]}
      >
        <div
          style={{
            fontSize: "x-large",
            paddingLeft: "10px",
            cursor: "pointer",
          }}
        >
          <MoreOutlined rotate={90} />
        </div>
      </Dropdown>
      <AddCourseBatchesModal
        isOpen={courseBatchModalOpen}
        setIsOpen={setCourseBatchModalOpen}
        cbName={props.courseBatchName}
        date={props.startDate}
        cbID={props.cbId}
      />
    </div>
  );
};

export default CourseBatchCard;