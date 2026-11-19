import style from "./Forms.module.css";
import { HeaderPermissionDisplay } from "../../components/HeaderPermissionDisplay";
import FormBody from "../../components/Forms/FormsBody";
import { Outlet } from "react-router-dom";
import TeamsForms from "./TeamsForms/TeamsForms";
import { useSelectionsStore } from "../../store/selectionStore";
import DashboardUserForms from "../../components/DashboardUserForms/DashboardUserForms";

type Props = {};

const Forms = (props: Props) => {
  const {
    selectedDomain,

    selectedCourse,
    selectedTeamMember,
    selectedCourseBatch,

    selectedTeam,
  } = useSelectionsStore();

  let componentToRender = null;

  if (selectedTeamMember) {
    componentToRender = <DashboardUserForms />;
  } else if (selectedTeamMember) {
    componentToRender = <TeamsForms />;
  } else {
    componentToRender = <TeamsForms />;
    // componentToRender = <FormBody />;
  }

  return (
    <>
      <div className={style.container}>{componentToRender}</div>
    </>
  );
};

export default Forms;
