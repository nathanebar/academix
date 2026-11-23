import { useEffect, useMemo, useRef, useState } from "react";
import { GenericOptionSwitch } from "../../UI/GenericOptionSwitch/GenericOptionSwitch";
import style from "./MissionsRepo.module.css";
import RegularInput from "../../UI/Input/Input/RegularInput";
import { useFilteredData } from "../../hooks/useFilteredData";
import { schemaMap, SchemaName } from "../../types/types";
import { useTaskGroupsByAxisIdToCalendar } from "../../hooks/useTaskGroupsByAxisIdToCalendar";
import TaskGroup from "../TaskGroup/TaskGroup";
import { useSelectionsStore } from "../../store/selectionStore";
import CalendarComponent from "../CalendarComponent/CalendarComponent";
import { usePermissionStore } from "../../store/permissionStore";
import { Button, ConfigProvider } from "antd";
import { useTaskGroupsByAxisId } from "../../hooks/useTaskGroupsByAxisId";
import { useAxisBatchArchiveData } from "../../hooks/useHierarchyData";

function MissionsRepo() {
  /* --------------------------- STATE --------------------------- */
  const [selectedOption, setSelectedOption] = useState<number>(2); // 2 = Dashboard (default)
  const [searchValue, setSearchValue] = useState<string>("");
  const [activeButtons, setActiveButtons] = useState<number[]>([]); // id‑ים של צירים פעילים
  const [filterNames, setFilterNames] = useState<string[]>([]); // שמות הצירים שסומנו

  /* --------------------------- STORES -------------------------- */
  const { filteredCourseBatches } = useFilteredData();
  const { selectedCourseBatch, selectedTeam } = useSelectionsStore();
  const axisBatchArchive = useAxisBatchArchiveData();
  const selectedPermission = usePermissionStore(
    (state) => state.selectedPermission
  );

  /* --------------------------- DATA ---------------------------- */
  // const { data: groupTasksR } = useTaskGroupsByAxisIdToCalendar(
  //   axisBatchArchive.map((axis: any) => axis?.id),
  //   selectedCourseBatch?.id,
  //   "operational"
  // );

  const { data: groupTasksR } = useTaskGroupsByAxisId(
    axisBatchArchive.map((axis: any) => axis?.id),
    selectedCourseBatch?.id,
    "operational"
  );
  const groupTasks =
    selectedOption === 2
      ? groupTasksR?.["operational"]
      : groupTasksR?.["assignment_bank"];
  /* ------------------- 1️⃣ אתחול ברירת‑מחדל -------------------- */
  // הצגים רק את הצירים של ה‑team/axis הרלוונטיים
  const filterAxisBatchArchive = axisBatchArchive?.filter(
    (axis) => axis.team_id == null || axis.team_id === selectedTeam?.id
  );

  // useRef משמש כדי לבצע את האתחול רק פעם אחת
  const hasInitialized = useRef(false);
  useEffect(() => {
    if (hasInitialized.current) return; // כבר אתחלנו – אל תבצע שוב
    if (!filterAxisBatchArchive?.length) return;

    const ids = filterAxisBatchArchive
      .filter((a: any) => a.id === 1)
      .map((a: any) => a.id);
    const names = filterAxisBatchArchive.map((a: any) => a.name);

    setActiveButtons(ids); // כל הצירים “דלוקים”
    setFilterNames(names); // וה‑filter יודע על כולם
    hasInitialized.current = true;
  }, [filterAxisBatchArchive]);

  /* ------------------- 2️⃣ שינוי ברירת‑מחדל ל‑סטודנט --------- */
  useEffect(() => {
    if (selectedPermission?.role_code === "STUDENT") {
      setSelectedOption(1); // אופליין אישי
    }
  }, [selectedPermission]);

  /* ------------------- 3️⃣ לחיצה על ציר ---------------------- */
  const toggleAxis = (axis: any) => {
    const { id, name } = axis;

    // activeButtons – id‑ים
    setActiveButtons((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );

    // filterNames – שמות הצירים
    setFilterNames((prev) =>
      prev.includes(name) ? prev.filter((x) => x !== name) : [...prev, name]
    );
  };

  const filteredTaskGroups = useMemo(() => {
    if (!groupTasks || !Array.isArray(groupTasks)) return [];
    if (activeButtons.length === 0) return [];

    let result = groupTasks.filter(
      (tg: any) =>
        // ✅ סינון לפי team_id: הצוות הנבחר או null
        (tg.team_id === selectedTeam?.id || tg.team_id == null) &&
        // ✅ סינון לפי כפתורים פעילים
        activeButtons.includes(tg.axisId)
      //  &&
      // tg?.axisName
    );
    if (searchValue?.trim()) {
      const q = searchValue.toLowerCase();
      result = result
        .map((group) => {
          const groupMatches =
            typeof group.name === "string" &&
            group.name.toLowerCase().includes(q);
          if (groupMatches) return group; // קבוצה שלמה
          if (Array.isArray(group.tasks)) {
            const matchingTasks = group.tasks.filter(
              (task: any) =>
                typeof task.taskName === "string" &&
                task.taskName.toLowerCase().includes(q)
            );
            if (matchingTasks.length > 0) {
              return { ...group, tasks: matchingTasks };
            }
          }
          return null; // לא מתאים
        })
        .filter((g) => g !== null) as any[];
    }

    return result;
  }, [groupTasks, activeButtons, searchValue, selectedTeam?.id]); // ✅ הוספת selectedTeam.id לתלויות
  // רק צירים שמתחברים ל‑team/axis שנבחרו
  const axisIds = useMemo(
    () => new Set(filterAxisBatchArchive?.map((a) => a.id)),
    [filterAxisBatchArchive]
  );

  const filteredTaskGroupsByAxis = filteredTaskGroups?.filter((tg) =>
    axisIds.has(tg.axisId)
  );

  /* ------------------- UI ----------------------- */
  const optionsLabel = [
    { id: 1, label: "אופליין" },
    { id: 2, label: "דאשבורד" },
  ];

  if (!filteredCourseBatches || filteredCourseBatches.length === 0) {
    return <div style={{ fontSize: 30 }}>אין מחזורים זמינים</div>;
  }

  return (
    <ConfigProvider
      theme={{
        components: {
          Button: {
            defaultHoverBg: "rgba(218,212,202,1)",
            defaultHoverBorderColor: "rgba(218,212,202,1)",
            defaultHoverColor: "black",
          },
        },
      }}
    >
      <div className={style.mainContainer}>
        {/* Calendar – תצוגת לוח שנה */}
        <CalendarComponent />

        {/* בחירת אופליין / דאשבורד */}
        <div className={style.options}>
          {selectedPermission?.role_code !== "STUDENT" ? (
            <GenericOptionSwitch
              SwitchContainerLabelStyle={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-evenly",
                gap: "8px",
                padding: "4px",
                backgroundColor: "#bfac8b",
                borderRadius: "20px",
                width: "50%",
                height: "2vh",
              }}
              OptionLabelStyle={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                height: "100%",
                width: "50%",
                borderRadius: "20px",
                fontSize: "11px",
                cursor: "pointer",
                transition: "all 0.2s ease",
              }}
              options={optionsLabel}
              selectedOption={selectedOption}
              setSelectedOption={setSelectedOption}
            />
          ) : (
            <h5>אופליין אישי</h5>
          )}
          <h5>מאגר משימות</h5>
        </div>

        {/* חיפוש + פילטר צירים */}
        <div className={style.search}>
          {/* חיפוש + פילטר צירים */}
          <div className={style.search}>
            <RegularInput
              value={searchValue}
              setValue={setSearchValue}
              height="3vh"
              placeholder="חיפוש קבוצת משימה"
            />
            <div className={style.titlesDiv}>
              <span>סנן לפי ציר</span>
              <Button
                onClick={() => {
                  setActiveButtons([]);
                }}
                className={style.clearButton}
              >
                נקה
              </Button>
            </div>
            <div className={style.axes}>
              {filterAxisBatchArchive?.map((axis: any) => {
                const isActive = activeButtons.includes(axis.id);
                const gradient = schemaMap[axis.color as SchemaName];

                return (
                  <div
                    key={axis.id}
                    className={style.axesNames}
                    style={{
                      background: isActive
                        ? gradient?.to
                        : "rgba(218,212,202,1)",
                      color: isActive ? "white" : "rgba(110,112,114,1)",
                    }}
                    onClick={() => toggleAxis(axis)} // ← שינוי קבוע
                  >
                    <span style={{ padding: 13 }}>{axis.name}</span>
                  </div>
                );
              })}
            </div>

            {/* רשימת משימות – מקבצים לפי הצירים הפעילים */}
            <div className={style.missions}>
              {filteredTaskGroupsByAxis /* .filter((tg: any) => tg.tasks.length !== 0)
              .length > 0 */ ? (
                filteredTaskGroupsByAxis
                  // .filter((tg: any) => tg.tasks.length !== 0)
                  .map((taskGroup: any) => { 
                    const axis = filterAxisBatchArchive?.find((a) => a.id === taskGroup.axisId);
                    const scheme =  axis?.color || "default";
                    return (<div
                      key={taskGroup.id}
                      className={style["task-group-wrapper"]}
                    >
                      <TaskGroup
                        scheme={scheme}
                        title={taskGroup.name}
                        id={taskGroup.id}
                        canModify={true}
                        filterOption={
                          selectedOption === 2
                            ? "operational"
                            : "assignment_bank"
                        }
                        isdayCalendar={true}
                        taskCount={taskGroup.task_count}
                      />
                    </div>
                   ) })
              ) : (
                <p>אין תוצאות</p>
              )}
            </div>
          </div>

          {/* התאמת Ant‑Design ל‑RTL – קוד שהייתה לך */}
          <style>
            {`
          :where(.css-dev-only-do-not-override-gna9eo).ant-input-affix-wrapper >input.ant-input,
          :where(.css-dev-only-do-not-override-gna9eo).ant-input-affix-wrapper >textarea.ant-input {
            font-size: inherit;
            border: none;
            border-radius: 0;
            outline: none;
            background: transparent;
            color: inherit;
            margin: 0;
          }
          :where(.css-dev-only-do-not-override-1urvyh0).ant-input-affix-wrapper >input.ant-input {
            padding: 0;
            margin: 0;
          }
        `}
          </style>
        </div>
      </div>
    </ConfigProvider>
  );
}

export default MissionsRepo;
