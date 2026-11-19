import React from "react";
import styles from "./CastingAssignments.module.css";
import { MinusCircleFilled, RedoOutlined } from "@ant-design/icons";
import Photo from "../../../UI/Photo/Photo";
import { useTaskUsers } from "../../../hooks/useTaskUsers";
import { useSelectionsStore } from "../../../store/selectionStore";
import { Dropdown, Popconfirm, Tooltip } from "antd";
import { queryClient } from "../../../api/queryClient";
import { useMutation } from "@tanstack/react-query";
import { deleteTaskAssignmentByUserId } from "../../../services/ApiServices";

type NewMissionProps = {
  missionId: any;
};

const CastingAssignments = (props: NewMissionProps) => {
  const { selectedTeam } = useSelectionsStore();
  const teamId = selectedTeam?.id;

  const handleDragStop = useMutation({
    mutationFn: async ({
      taskId,
      userId,
    }: {
      taskId: string;
      userId: string;
    }) => {

      await deleteTaskAssignmentByUserId(taskId, teamId, userId);
    },

    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["group-tasks"] });
      queryClient.refetchQueries({ queryKey: ["task-users"] });
      queryClient.refetchQueries({ queryKey: ["taskAssignments"] });
    },
  });

  const {
    data: soldiers,
    isLoading,
    isError,
  } = useTaskUsers(props.missionId, teamId);

  if (isLoading) return <div>Loading...</div>;
  if (isError) return <div>Error loading soldiers</div>;

  return (
    <> 
    {soldiers.length ?<div className={styles.container}>
      <div className={styles.header}>
        <h2>חיילים ששובצו</h2>
      </div>

      <div className={styles.soldiersList}>
        {soldiers?.map((soldier: any) => (
          <div key={soldier.id} className={styles.soldierRow}>
            <div className={styles.soldierInfo}>
              <Photo
                username={soldier?.username}
                style={{
                  width: "1rem",
                  height: "1rem",
                  cursor: "pointer",
                }}
              />
              <span className={styles.soldierName}>
                {soldier.name.length > 14 ? (
                  <Tooltip title={soldier.name}>
                    {soldier.name.substring(0, 11)}...
                  </Tooltip>
                ) : (
                  soldier.name
                )}
              </span>
            </div>
            <div className={styles.iconsContainer}>
              <Popconfirm
                title="האם אתה בטוח שברצונך להסיר את החייל מהמשימה?"
                description="פעולה זו לא ניתנת לביטול"
                onConfirm={() =>
                  handleDragStop.mutate({
                    taskId: soldier.taskId,
                    userId: soldier.userId,
                  })
                }
                okText="כן, מחק"
                cancelText="ביטול"
                placement="left"
              >
              <Tooltip title={'הסרת חייל ממשימה'}>

                <MinusCircleFilled
                  className={styles.icon}
                  style={{ color: "black", cursor: "pointer" }}
                />
              </Tooltip>

              </Popconfirm>
              <Tooltip title={`שובץ ב ${soldier.start}`}>
                <RedoOutlined
                  className={styles.icon}
                  style={{ color: "#44C7A5" }}
                />
              </Tooltip>
            </div>
          </div>
        ))}
      </div>
    </div>:<></>}
    </>
   
  );
};

export default CastingAssignments;
