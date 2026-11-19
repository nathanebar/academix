import DashboardTeamBody from "../../../components/DashboardTeam/DashboardTeamBody";

import { HeaderPermissionDisplay } from "../../../components/HeaderPermissionDisplay";
import style from "../Dashboard.module.css";

type Props = {};

const TeamDashboard = (props: Props) => {
  return (
    <div className={style["container"]}>
      <HeaderPermissionDisplay />

      <DashboardTeamBody />
    </div>
  );
};

export default TeamDashboard;
