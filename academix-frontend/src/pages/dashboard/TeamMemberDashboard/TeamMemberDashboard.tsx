import { HeaderPermissionDisplay } from "../../../components/HeaderPermissionDisplay";
import style from "./TeamMemberDashboard.module.css";
import { useSelectionsStore } from "../../../store/selectionStore";
import DashboardTeamMember from "../../../components/DashboardTeamMember/DashboardTeamMember";
type Props = {};

const TeamMemberDashboard = (props: Props) => {
  const { selectedTeamMember, setSelectedTeamMember } = useSelectionsStore();

  return (
    <div className={style["container"]}>
      <HeaderPermissionDisplay />

      <DashboardTeamMember />
    </div>
  );
};

export default TeamMemberDashboard;
