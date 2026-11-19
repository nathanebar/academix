import style from "./FeedbackDashboard.module.css";
import { HeaderPermissionDisplay } from "../../../components/HeaderPermissionDisplay";
import FeedbackDashCourse from "../../../components/FeedbackDashCourse/FeedbackDashCourse";
import { useSelectionsStore } from "../../../store/selectionStore";
import FeedbackDashboardByUser from "../FeedbackDashboardByUser/FeedbackDashboardByUser";

type Props = {};
function FeedbackDashboard({}: Props) {
  const { selectedTeamMember, setSelectedTeamMember } = useSelectionsStore();
  return (
    <div className={style.container}>
      <HeaderPermissionDisplay />
      {!selectedTeamMember ? (
        <FeedbackDashCourse />
      ) : (
        <FeedbackDashboardByUser />
      )}
    </div>
  );
}

export default FeedbackDashboard;
