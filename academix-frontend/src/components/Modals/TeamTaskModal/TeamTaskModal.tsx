import React, { useEffect, useRef, useState } from "react";
import style from "./teamTaskModal.module.css";
import { Card, Dropdown, Modal, Popconfirm, Table } from "antd";

import MembersTable from "./utills/MembersTable";
import ProgressLevelsCard from "../../progressLevelsCard/ProgressLevelsCard";
import ExceptionSoldiers from "./utills/ExpectionSoldier";
import CardUI from "../../../UI/Card/Card";
import { useSelectionsStore } from "../../../store/selectionStore";
import { useFetchFeedbacksByCourseId } from "../../../hooks/feedback/useFetchFeedbackByCourseId";
import { useTaskById } from "../../../hooks/useGetTaskById";
import { useFetchTaskAssignments } from "../../../hooks/useFetchTaskAssignments";
import { useTaskUsers } from "../../../hooks/useTaskUsers";

export type UserTaskModalProps = {
  taskGroupName?: string;
  taskId?: number;
  task?: any;
  openModal: boolean;
  setOpenModal: React.Dispatch<React.SetStateAction<boolean>>;
};
const TeamTaskModal = (props: UserTaskModalProps) => {
  const { selectedTeam, selectedCourse,selectedCourseBatch } = useSelectionsStore();
  const feedbacks = useFetchFeedbacksByCourseId(
    selectedCourse.id,
    selectedCourseBatch.id,
    selectedTeam?.id || -1
  );

  const { data: task } = useTaskById(props.task.id);
  const handleClose: () => void = () => props.setOpenModal(false);

  
  const { data: usersTask } = useTaskUsers(props.task.id, selectedTeam.id);
  return (
    <Modal
      classNames={{ body: style["body"] }}
      open={props.openModal}
      width={"58.62268518518518vw"}
      height={"77.29124236252545vh"}
      className={style.modal}
      onCancel={handleClose}
      footer={null}
    >
      <div className={style["container"]}>
        <ProgressLevelsCard
          // title="סטטוס השלמת המשימה"
          isGenericGraph
          style={{ width: "100%", height: "17.10794297352342vh" }}
          // status={{
          //   value: Math.floor(props.task?.completed_tm_ids?.length),
          //   max: props.task?.totalmembers,
          // }}
        />{" "}
        <CardUI
          bodyStyle={{ padding: 0 }}
          width={"45%"}
          height={"17.10794297352342vh"}
          title="חריגות לפי חיילים"
        >
          <ExceptionSoldiers
            usersTask={usersTask}
            task={props.task}
            feedbacks={feedbacks.data}
          />
        </CardUI>
        <MembersTable
          usersTask={usersTask}
          feedbacks={feedbacks?.data}
          task={{
            ...task,
            completed_all_tm_ids:props.task.completed_all_tm_ids,
            completed_tm_ids: props.task.completed_tm_ids,
            completed_at_only_tm_ids: props.task.completed_at_only_tm_ids,
          }}
        />
      </div>
    </Modal>
  );
};

export default TeamTaskModal;
