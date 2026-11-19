import style from "./AllForms.module.css";
import { HeaderPermissionDisplay } from "../../../components/HeaderPermissionDisplay";
import FormBody from "../../../components/Forms/FormsBody";

type Props = {};

const AllForms = (props: Props) => {
  return (
    <div className={style.container}>
      <HeaderPermissionDisplay />
      <FormBody />
    </div>
  );
};

export default AllForms;
