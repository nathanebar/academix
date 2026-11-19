import DashboardCourseBatchBody from "../../../components/DashboardCourseBatch/DashboardCourseBatchBody";
import { HeaderPermissionDisplay } from "../../../components/HeaderPermissionDisplay";
import style from "../Dashboard.module.css";

const CourseBatchDashboard = () => {
  return (
    <div className={style["container"]}>
      <HeaderPermissionDisplay />
      <DashboardCourseBatchBody />
    </div>
  );
};

export default CourseBatchDashboard;
