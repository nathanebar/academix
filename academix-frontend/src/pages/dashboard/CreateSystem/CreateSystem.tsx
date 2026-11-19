import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { AutoComplete, ConfigProvider, Input, notification } from "antd";
import api from "../../../api/axios";
import { OnSearch } from "../../../utils/OnSearch";
import { useUserStore } from "../../../store/userStore";
import { useAddPermission } from "../../../hooks/useAddPermission";
import { Assignment, ROLE_CODE } from "../../../types/types";
import style from "../Dashboard.module.css";

interface UserResult {
  value: string;
  label: string;
  username: string;
  fullName: string;
}

const CreateSystem = () => {
  const navigate = useNavigate();
  const { user } = useUserStore();
  const { addNewPermission } = useAddPermission(); 
  
  const [systemName, setSystemName] = useState("");
  const [searchInputValue, setSearchInputValue] = useState("");
  const [results, setResults] = useState<UserResult[]>([]);
  const [resultsObj, setResultsObj] = useState<any[]>([]);
  const [selectedAdmin, setSelectedAdmin] = useState<{ username: string; fullName: string; id?: number } | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!systemName.trim()) {
      setError("שם המערכת הוא שדה חובה");
      notification.error({ message: "נא להזין שם מערכת" });
      return;
    }
    if (!selectedAdmin) {
      setError("בחירת מנהל מערכת היא חובה");
      notification.error({ message: "נא לבחור מנהל מערכת" });
      return;
    }

    setLoading(true);
    setError("");

    try {
      const response = await api.post("/systems", { 
        name: systemName,
        adminUsername: selectedAdmin.username
      });
      
      const newPermission: Assignment = {
        id: response.data.permissionId || response.data.id,
        user_id: selectedAdmin.id || 0,
        role_code: "SYSTEM-ADMIN" as ROLE_CODE,
        scope_type: "system",
        scope_id: response.data.id,
        scopeName: systemName,
        role_name: "מנהל מערכת",
        allowedTeamIds: [],
        allowedCourseIds: [],
        allowedCourseBatcheIds: [],
        allowedAxisIds: [],
        allowedDomainIds: [],
      };
      
      addNewPermission(newPermission);
      
      notification.success({
        message: "המערכת נוצרה בהצלחה!",
        placement: "top",
        style: { direction: "rtl" }
      });
      
      navigate("/dashboard/dev");
    } catch (err: any) {
      setError("שגיאה ביצירת המערכת");
      console.error(err);
      notification.error({ message: "שגיאה ביצירת המערכת" });
    } finally {
      setLoading(false);
    }
  };

  const HandleOnSearch = async (value: string) => {
    await OnSearch(value, searchInputValue, setResults, setResultsObj);
  };

  const GetUserFromArr = async (input: string) => {
    let username: string;
    const hyphenIndex = input.indexOf("-");
    if (hyphenIndex === -1) {
      username = input;
    } else {
      username = input.substring(0, hyphenIndex);
    }
    try {
      const userObj = resultsObj?.find(
        (r: any) => r?.username === username.trim()
      );
      if (userObj) {
        setSelectedAdmin({
          username: userObj.username,
          fullName: userObj.fullName,
          id: userObj.id
        });
        setSearchInputValue(userObj.fullName);
        setResults([]);
      }
    } catch (error) {
      console.log(error);
    }
  };

  return (
    <ConfigProvider
      theme={{
        components: {
          Select: {
            borderRadius: 100,
            colorBgContainer: "rgba(244,241,235,1)",
          },
          Input: {
            colorBgContainer: "rgba(244,241,235,1)",
          },
        },
      }}
    >
      <div className={style["container"]}>
        <h1 style={{ fontSize: '26px', fontWeight: 'bold', marginBottom: '24px' }}>
          צור מערכת חדשה
        </h1>
        <form onSubmit={handleSubmit} style={{ maxWidth: '500px', margin: '0 auto' }}>
          <div style={{ marginBottom: '20px' }}>
            <label 
              htmlFor="systemName" 
              style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold' }}
            >
              שם המערכת:
            </label>
            <input
              type="text"
              id="systemName"
              value={systemName}
              onChange={(e) => setSystemName(e.target.value)}
              placeholder="הכנס שם למערכת"
              style={{
                width: '100%',
                padding: '12px',
                fontSize: '16px',
                border: '1px solid #ddd',
                borderRadius: '8px',
                boxSizing: 'border-box',
                backgroundColor: 'rgba(244,241,235,1)'
              }}
            />
          </div>
          <div style={{ marginBottom: '20px' }}>
            <label 
              style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold' }}
            >
              מנהל מערכת:
            </label>
            <AutoComplete
              style={{ width: "100%", height: "40px" }}
              options={results}
              onSelect={(value) => {
                setSearchInputValue(value);
                GetUserFromArr(value);
              }}
              value={searchInputValue}
            >
              <Input.Search
                placeholder="חפש/י מנהל מערכת"
                allowClear
                onChange={(e) => {
                  setResults([]);
                  setSearchInputValue(e.target.value);
                }}
                onSearch={HandleOnSearch}
                onKeyDown={(e: any) => {
                  if (e.ctrlKey && (e.key === "k" || e.key === "ל")) {
                    e.preventDefault();
                    HandleOnSearch(e?.target?.value);
                  }
                }}
              />
            </AutoComplete>
            {selectedAdmin && (
              <p style={{ marginTop: '8px', color: '#4a90d9', fontSize: '14px' }}>
                נבחר: {selectedAdmin.fullName}
              </p>
            )}
          </div>
          {error && (
            <div style={{ color: 'red', marginBottom: '16px' }}>
              {error}
            </div>
          )}
          <div style={{ display: 'flex', gap: '12px' }}>
            <button
              type="submit"
              disabled={loading}
              style={{
                flex: 1,
                padding: '12px 20px',
                fontSize: '16px',
                cursor: loading ? 'not-allowed' : 'pointer',
                backgroundColor: loading ? '#ccc' : '#4a90d9',
                color: 'white',
                border: 'none',
                borderRadius: '8px'
              }}
            >
              {loading ? "יוצר..." : "צור מערכת"}
            </button>
            <button
              type="button"
              onClick={() => navigate("/dashboard/dev")}
              style={{
                flex: 1,
                padding: '12px 20px',
                fontSize: '16px',
                cursor: 'pointer',
                backgroundColor: '#f5f5f5',
                color: '#333',
                border: '1px solid #ddd',
                borderRadius: '8px'
              }}
            >
              ביטול
            </button>
          </div>
        </form>
      </div>
    </ConfigProvider>
  );
};

export default CreateSystem;