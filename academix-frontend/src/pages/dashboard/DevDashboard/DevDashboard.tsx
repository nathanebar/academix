import { useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { usePermissionStore } from "../../../store/permissionStore";
import { useUserStore } from "../../../store/userStore";
import { useSelectionsStore } from "../../../store/selectionStore";
import api from "../../../api/axios"
import style from "../Dashboard.module.css";

type Props = {};

interface SystemCard {
  scope_id?: number;
  scopeName: string;
  allowedTeamIds: number[];
  allowedCourseIds: number[];
  allowedDomainIds?: number[];
}

const DevDashboard = () => {
  const navigate = useNavigate();
  const { user } = useUserStore();
  const {
    setSelectedPermission,
    error
  } = usePermissionStore();
  const {
    setSelectedSystemId,
    setSelectedSystem,
  } = useSelectionsStore();
  const [systems, setSystems] = useState<SystemCard[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState("");

  useEffect(() => {
    fetchAllSystems();
  }, []);

  const fetchAllSystems = async () => {
    try {
      setLoading(true);
      const response = await api.get("/systems");
      setSystems(response.data);
    } catch (err: any) {
      console.error(err);
      setErrorMsg("שגיאה בטעינת המערכות");
    } finally {
      setLoading(false);
    }
  };

  const handleSystemSelect = (system: SystemCard) => {
    if (!system.scope_id) {
      return;
    }
    
    setSelectedPermission({
      id: 0,
      user_id: user?.id || 0,
      scope_type: "system",
      scope_id: system.scope_id,
      scopeName: system.scopeName,
      role_code: "SYSTEM-ADMIN",
      role_name: "מנהל מערכת",
      allowedTeamIds: system.allowedTeamIds || [],
      allowedCourseIds: system.allowedCourseIds || [],
      allowedCourseBatcheIds: [],
      allowedAxisIds: [],
      allowedDomainIds: system.allowedDomainIds || [],
    });
    
    setSelectedSystemId(system.scope_id);
    setSelectedSystem(system);
    navigate("/dashboard/domain");
  };

  const handleAddSystem = () => {
    navigate("/dashboard/dev/create");
  };

  return (
    <div className={style["container"]}>
      <h1 style={{ fontSize: '26px', fontWeight: 'bold', marginBottom: '24px' }}>
        בחר מערכת לניהול
      </h1>
      
      {errorMsg ? (
        <div style={{ textAlign: 'center', padding: '40px', color: 'red' }}>
          <p>שגיאה: {errorMsg}</p>
          <button
            onClick={fetchAllSystems}
            style={{
              padding: '10px 20px',
              fontSize: '16px',
              cursor: 'pointer',
              backgroundColor: '#4a90d9',
              color: 'white',
              border: 'none',
              borderRadius: '8px'
            }}
          >
            נסה שוב
          </button>
        </div>
      ) : loading ? (
        <div style={{ textAlign: 'center', padding: '40px' }}>
          <p>טוען מערכות...</p>
        </div>
      ) : systems.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '40px' }}>
          <p>אין מערכות במערכת</p>
        </div>
      ) : (
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
          gap: '24px',
          padding: '20px'
        }}>
          <div
            onClick={handleAddSystem}
            role="button"
            tabIndex={0}
            onKeyPress={(e) => {
              if (e.key === 'Enter') handleAddSystem();
            }}
            style={{
              cursor: 'pointer',
              border: '2px dashed #ccc',
              borderRadius: '8px',
              padding: '20px',
              backgroundColor: '#f9f9f9',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              minHeight: '200px',
              transition: 'transform 0.2s, box-shadow 0.2s'
            }}
          >
            <div style={{ fontSize: '48px', marginBottom: '16px', color: '#4a90d9' }}>
              +
            </div>
            <h3 style={{ margin: '0 0 8px 0', color: '#4a90d9', textAlign: 'center' }}>
              הוסף מערכת חדשה
            </h3>
          </div>

          {systems.map((system) => (
            <div
              key={system.scope_id}
              onClick={() => handleSystemSelect(system)}
              role="button"
              tabIndex={0}
              onKeyPress={(e) => {
                if (e.key === 'Enter') handleSystemSelect(system);
              }}
              style={{
                cursor: 'pointer',
                border: '1px solid #ddd',
                borderRadius: '8px',
                padding: '20px',
                backgroundColor: '#fff',
                transition: 'transform 0.2s, box-shadow 0.2s'
              }}
            >
              <div style={{ fontSize: '48px', marginBottom: '16px', textAlign: 'center' }}>
                🖥️
              </div>
              <h3 style={{ margin: '0 0 8px 0', color: '#333', textAlign: 'center' }}>
                {system.scopeName}
              </h3>
              <p style={{ margin: '4px 0', color: '#666', fontSize: '14px', textAlign: 'center' }}>
                תחומים: {system.allowedDomainIds ? system.allowedDomainIds.length : 0}
              </p>
              <p style={{ margin: '4px 0', color: '#666', fontSize: '14px', textAlign: 'center' }}>
                קורסים: {system.allowedCourseIds.length}
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default DevDashboard;