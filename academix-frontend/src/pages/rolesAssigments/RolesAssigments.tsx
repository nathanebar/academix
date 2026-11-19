import RolesAssigmentsBody from "../../components/RolesAssigmentBody/RolesAssigmentBody";
import style from "../dashboard/Dashboard.module.css";
const RolesAssigments = () => {
    return (
            <div>
      <div className={style["container"]}>
        <h1 style={{fontSize:'26px', fontWeight:"bold"}}>קורסים פעילים ועתידיים</h1>
              <RolesAssigmentsBody/>
      </div>
    </div>

      );
}
 
export default RolesAssigments;