import FormDetailes from "../../../components/Forms/FormDetailes/FormDetailes";
import { HeaderPermissionDisplay } from "../../../components/HeaderPermissionDisplay";
import style from "../Dashboard.module.css";

const FormsDashboard = () => {
  return (
    <div className={style.container}>
      <HeaderPermissionDisplay />
      <FormDetailes />
    </div>
  );
};

export default FormsDashboard;
