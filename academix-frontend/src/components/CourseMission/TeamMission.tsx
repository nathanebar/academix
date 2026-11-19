import style from "./TeamMission.module.css";
import AxesCard from "./AxesCard/AxesCard";
import { useFilteredDataStore } from "../../store/filteredDataStore";
import { useSelectionsStore } from "../../store/selectionStore";
import { useCourseBatchStore } from "../../store/courseBatchStore";
import { useTaskCount } from "../../hooks/useFetchTaskCount";

const TeamMission = () => {
  const { filteredCourseBatches } = useFilteredDataStore();
  const { axisBatchArchive: axes } = useCourseBatchStore();
  const { selectedTeam, selectedCourseBatch } = useSelectionsStore();

  const courseBatchId = selectedCourseBatch?.id;
  const teamId = selectedTeam?.id;
  const axisIds = axes?.map((ax) => ax.id);

  const { data } = useTaskCount(axisIds, teamId, courseBatchId);

  const hasAxes = axes.length > 0 || filteredCourseBatches.length > 0;

  const mergedData = data?.data?.map((d: any) => ({
    ...d,
    color: axes?.find((ax: any) => ax.name === d.name)?.color || null,
  }));

  return (
    <div>
      <div style={{ padding: "1vh" }}>
        <div style={{ display: "flex", justifyContent: "space-between" }}>
          <h3
            style={{ fontWeight: 600, fontSize: "14px", color: "GrayText" }}
            className={style.title}
          >
            מאגר משימות
          </h3>
        </div>

        {hasAxes ? (
          <>
            <div className={style.sub_title}>
              <div>מופעים</div>
              <div>בוצע</div>
            </div>
            <div className={style.axesContainer}>
              {mergedData?.map((ax: any, index: any) => (
                <AxesCard
                  key={ax?.id}
                  color={ax.color}
                  axesName={ax.name}
                  index={index}
                  totalTaskAssignments={ax?.totalTaskAssignments}
                  missionCount={ax?.missionCount}
                  completedPercent={ax?.completedPercent}
                  completedTaskCount={ax?.completedTaskCount}
                />
              ))}
            </div>
          </>
        ) : (
          <p style={{ color: "#9ca3af", fontSize: "12px" }}>
            כאן יופיעו הצירים
          </p>
        )}
      </div>
    </div>
  );
};

export default TeamMission;
