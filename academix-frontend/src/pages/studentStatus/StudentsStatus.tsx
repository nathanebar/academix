import React, { useEffect, useState } from "react";
import { HeaderPermissionDisplay } from "../../components/HeaderPermissionDisplay";
import style from "./studentsStatus.module.css";
import { useFilteredData } from "../../hooks/useFilteredData";
import StudentStatusCard from "./studentStatusCard/StudentStatusCard";
import { Button, Tooltip } from "antd";
import {
  CompressOutlined,
  ExpandOutlined,
} from "@ant-design/icons";
import { useSelectionsStore } from "../../store/selectionStore";
import { useNavigate } from "react-router-dom";
import StudentExpandedView from "../StudentExpandedView/StudentExpandedView";

type Props = {};

const StudentsStatus = (props: Props) => {
  const { filteredTeamMembers } = useFilteredData();
  const { selectedTeam, selectedTeamMember } = useSelectionsStore();
  
  const [isExpandedAll, setIsExpandedAll] = useState<boolean>(false);
  const [colors, setColors] = useState<string[]>(Array(10).fill(""));
  const navigate = useNavigate();
  const hue = 210;



useEffect(() => {
  setColors([
    "hsl(215, 55%, 80%)",  // כחול
    "hsl(0, 75%, 82%)",    // אדום
    "hsl(45, 85%, 78%)",   // צהוב
    "hsl(145, 45%, 78%)",  // ירוק
    "hsl(270, 50%, 82%)",  // סגול
    "hsl(25, 80%, 80%)",   // כתום
    "hsl(11, 70%, 82%)",   // ורוד
    "hsl(185, 45%, 80%)",  // טורקיז
    "hsl(85, 55%, 78%)",   // ליים
  ]);
  return;
}, []);

  useEffect(() => {
    if (selectedTeam) {
      navigate("/studentStatus");
    }
  }, [selectedTeam, navigate]);

  const teamStudents = filteredTeamMembers.filter(
    (teamMember) => teamMember.member_role === "STUDENT"
  );

  const displayedStudents = selectedTeamMember
    ? teamStudents.filter((tm) => tm.id === selectedTeamMember.id)
    : teamStudents;

const [expandedStudent, setExpandedStudent] = useState<{ student: any; color: string } | null>(null);
     const {
  
    setSelectedTeamMember,
   
  } = useSelectionsStore();
    const { selectedDate, activeHeaderType, setActiveHeaderType } =
    useSelectionsStore();
    

  
  return (
    <div className={style["container"]}>
      <div className={style["header-container"]}>
        <HeaderPermissionDisplay />
      </div>

      <div className={style["card-container"]}>
  {/* התצוגה המורחבת מוצגת רק כשנבחר חניך במבט יחידני */}
{selectedTeamMember && activeHeaderType === "teamMember" ? (
  <StudentExpandedView
    student={selectedTeamMember}
    color={
      colors[
        displayedStudents.findIndex((m) => m.id === selectedTeamMember.id) % 10
      ] ?? "#d98e7e"
    }
    onBack={() => {
      
      setSelectedTeamMember(null);
      setActiveHeaderType("team");
    }}
  />
) : (
  <div className={style["card-container"]}>
    {displayedStudents.map((teamMember, index) => (
      <StudentStatusCard
        key={teamMember.id}
        expendedAll={isExpandedAll}
        color={colors[index % 10]}
        student={teamMember}
        onExpand={(e) => {
          e.stopPropagation();
          setSelectedTeamMember(teamMember);
          setActiveHeaderType("teamMember");
        }}
      />
    ))}
  </div>
)}
      </div>

      <Tooltip
        title={isExpandedAll ? "לצמצם את כל הצירים" : "להרחיב את כל הצירים"}
      >
        <Button
          type="text"
          icon={isExpandedAll ? <CompressOutlined /> : <ExpandOutlined />}
          onClick={() => setIsExpandedAll(!isExpandedAll)}
          style={{
            display: "flex",
            cursor: "pointer",
            position: "absolute",
            width: 50,
            height: 50,
            top: "93vh",
            left: "6vw",
            alignItems: "center",
            justifyContent: "center",
            transition: "all 0.3s",
            border: "1px solid #aaa",
            backgroundColor: "#fafafa",
          }}
        />
      </Tooltip>
    </div>
  );
};

export default StudentsStatus;