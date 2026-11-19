import { HeaderPermissionDisplay } from "../../../components/HeaderPermissionDisplay";
import TeamsFormsBody from "../../../components/Forms/TeamsForms/TeamsFormsBody";
import style from "./TeamsForms.module.css";

const TeamsForms = () => {
  return (
    <div className={style.container}>
      <HeaderPermissionDisplay />
      <TeamsFormsBody />
    </div>
  );
};

export default TeamsForms;
