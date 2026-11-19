import style from "./DashboardUserForms.module.css";
import { HeaderPermissionDisplay } from "../HeaderPermissionDisplay";
import { useFetchFormsByUser } from "../../hooks/Forms/useFetchFormsByUserId";
import ScoreChartUserForms from "./ScoreChartUserForms/ScoreChartUserForms";
import ScoreProgressUserForms from "./ScoreProgressUserForms/ScoreProgressUserForms";
import FormFiltersAndList from "./FormFiltersAndList/FormFiltersAndList";
import { useSelectionsStore } from "../../store/selectionStore";
import { useFilteredDataStore } from "../../store/filteredDataStore";
import { useEffect } from "react";
import { usePermissionStore } from "../../store/permissionStore";
import ScoreTrajectory from "./ScoreTrajectory/ScoreTrajectory";
import ScoreInsights from "./ScoreInsights/ScoreInsights";
import { useNavigate } from "react-router-dom";

type Props = {};

const DashboardUserForms = (props: Props) => {
  const { selectedTeamMember, selectedTeam, selectedCourseBatch } =
    useSelectionsStore();
  const { selectedPermission } = usePermissionStore();
  const navigate = useNavigate();

  const {
    data: forms,
    isLoading,
    isError,
    error,
    refetch,
  } = useFetchFormsByUser(
    Number(selectedTeamMember?.id),
    selectedTeam?.id,
    undefined,
    selectedCourseBatch?.id,
    selectedPermission?.role_code
  );

  useEffect(() => {
    console.log(selectedTeamMember);
    const uid = Number(selectedTeamMember?.id);
    if (uid && !Number.isNaN(uid) && uid > 0) {
      refetch();
    }
  }, [selectedTeamMember?.id, refetch]);

  const { filteredTeamMembers, filteredCourseBatches } = useFilteredDataStore();

  if (isLoading) {
    return (
      <div className={style["container"]}>
        <HeaderPermissionDisplay />
        <p>טוען מבחנים...</p>
      </div>
    );
  }
  if (isError) {
    return (
      <div className={style["container"]}>
        <HeaderPermissionDisplay />
        <p>שגיאה בטעינת המבחנים: {error?.message || "Unknown error"}</p>
      </div>
    );
  }

  if (!filteredCourseBatches || filteredCourseBatches.length === 0) {
    return <div style={{ padding: 30, fontSize: 30 }}>אין מחזורים זמינים</div>;
  }

  const filteredDataOfTeamMemberStudent = filteredTeamMembers?.filter(
    (item) => item.member_role !== "TEAM_COMMANDER"
  );

  if (
    !filteredDataOfTeamMemberStudent ||
    filteredDataOfTeamMemberStudent.length === 0
  ) {
    return (
      <>
        <div
          style={{
            direction: "rtl",
            display: "flex",
            justifyContent: "space-between",
            alignContent: "center",
          }}
        >
          <HeaderPermissionDisplay />
        </div>
        <div style={{ fontSize: 30, direction: "rtl", padding: 10 }}>
          אין חיילים בצוות{" "}
        </div>
      </>
    );
  }

  return (
    <div className={style["container"]}>
      <HeaderPermissionDisplay />

      <div
        style={{
          display: "flex",
          width: "100%",
          paddingTop: "15px",
          gap: 10,
        }}
      >
        <ScoreTrajectory
          forms={forms}
          onSelectForm={(f) => navigate(`/forms/show/${f.taskassignmentid}`)}
        />
        <ScoreInsights forms={forms} />
        {/* <ScoreChartUserForms feedbacks={null} forms={forms} /> */}
        {/* <ScoreProgressUserForms forms={forms} /> */}
      </div>
      <FormFiltersAndList forms={forms ?? []} />
    </div>
  );
};

export default DashboardUserForms;
