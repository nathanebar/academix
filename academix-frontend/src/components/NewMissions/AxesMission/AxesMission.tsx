import React, { useEffect, useState } from "react";
import style from "./AxesMission.module.css";
import { useTasksByTeamIds } from "../../../hooks/useTasksByTeamIds";
import NewTask from "../NewTask";
import { useSelectionsStore } from "../../../store/selectionStore";
type Props = {
  teamIds: Number[];
};

const AxesMission = (props: Props) => {
  const [num, setNum] = useState(0);

  const { selectedCourseBatch } = useSelectionsStore();

  const { data: tasks } = useTasksByTeamIds(
    props.teamIds,
    selectedCourseBatch.id
  );

  useEffect(() => {
    if (!tasks) return;
    const unseenCount = tasks.filter((t: any) => t.is_seen === null).length;
    setNum(unseenCount);
  }, [tasks]);

  const sortedTasks = tasks
    ? [...tasks].sort((a: any, b: any) => {
        if (a.is_seen === null && b.is_seen !== null) return -1;
        if (a.is_seen !== null && b.is_seen === null) return 1;
        return 0;
      })
    : [];

  return (
    <>
      <div className={style.container}>
        <p>עדכונים {`(${num})`}</p>
        {sortedTasks.map((t: any) => (
          <NewTask
            description={t.description}
            byUser={t.User.name}
            is_seen={t.is_seen}
            id={t.id}
          />
        ))}
      </div>
    </>
  );
};

export default AxesMission;
