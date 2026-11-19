import DashboardAdminHeader from '../../../components/DashboardAdminHeader/DashboardAdminHeader'
import DashboardAdminBody from '../../../components/DashboardAdminBody/DashboardAdminBody'
import style from "../Dashboard.module.css";
import { useRoleNavigation } from '../../../hooks/useRoleNavigation';
import { HeaderPermissionDisplay } from '../../../components/HeaderPermissionDisplay';
import { useEffect } from 'react';
import { usePermissionStore } from '../../../store/permissionStore';
import { useNavigate } from 'react-router-dom';
import { getTeamMemberByUserIdAndTeamId } from '../../../services/ApiServices';
import { useUserStore } from '../../../store/userStore';
import { useSelectionsStore } from '../../../store/selectionStore';

type Props = {};

const DomainDashboard = (props: Props) => {

  const selectedPermission = usePermissionStore(
    (state) => state.selectedPermission
  );
const navigate = useNavigate();

  const { user } = useUserStore();

    const { setSelectedDomain, setSelectedTeam, setSelectedTeamMember } =
        useSelectionsStore();

  return (
    <div>
      <div className={style["container"]}>
        {/* <h1 style={{fontSize:'26px', fontWeight:"bold"}}>קורסים פעילים ועתידיים</h1> */}
         {/* <HeaderPermissionDisplay /> */}
        <DashboardAdminHeader />
        <DashboardAdminBody />
      </div>
    </div>
  );
};

export default DomainDashboard;
