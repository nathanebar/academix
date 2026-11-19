import React, { useState, useCallback, useMemo, useEffect } from "react";
import style from "./CourseContent.module.css";
import { HeaderPermissionDisplay } from "../../components/HeaderPermissionDisplay";
import CircularSelect from "../../components/CircularSelect/CircularSelect";
import { GenericOptionSwitch } from "../../UI/GenericOptionSwitch/GenericOptionSwitch";
import AxisBoard from "../../components/Axis/AxisBoard/AxisBoard";
import { useFilteredDataStore } from "../../store/filteredDataStore";
import { useCourseBatchStore } from "../../store/courseBatchStore";
import { useSelectionsStore } from "../../store/selectionStore";
import { usePermissionStore } from "../../store/permissionStore";
import { Condition, QueryField, QueryGroup } from "../../types/types";
import { useAdvancedSearch } from "../../hooks/useAdvancedSearch";
import QueryBuilder from "./QueryBuilder/QueryBuilder";
import { Button, Drawer, Space, Tag, Tooltip } from "antd";
import { ArrowLeftOutlined, ArrowRightOutlined, CloseOutlined, FileSearchOutlined, FilterOutlined } from "@ant-design/icons";
import { useSearchNavStore } from "../../store/searchNavStore";

const options = [
  { value: "operational", label: "מאגר משימות" },
  { value: "assignment_bank", label: "אופליין" },
  { value: "archives", label: "ארכיון" },
];

const optionsLabel = [
  { id: 1, label: "תצוגת צירים" },
  { id: 2, label: "תצוגת שלבי הסמכה" },
  { id: 3, label: "תצוגת לפי תיוגים" },
  { id: 4, label: "תצוגת לפי צבעים" },
];


// ═══════════ תרגום שדות ואופרטורים לייצוג קריא ═══════════
const FIELD_LABELS: Record<QueryField, string> = {
  search: "חיפוש",
  color: "צבע",
  tag: "תגית",
  gradeStage: "שלב הסמכה",
};

const OPERATOR_LABELS: Record<string, string> = {
  contains: "מכיל",
  equals: "שווה",
  not_equals: "לא שווה",
};

const formatConditionValue = (value: any): string => {
  if (Array.isArray(value)) {
    if (value.length === 0) return "—";
    // אם זה אובייקטים (למשל tags/gradeStages עם id+name)
    return value
      .map((v) => (typeof v === "object" && v !== null ? v.name || v.label || v.id : v))
      .join(", ");
  }
  return String(value ?? "—");
};

// בונה תיאור טקסטואלי לתנאי בודד
const describeCondition = (cond: Condition): string => {
  const field = FIELD_LABELS[cond.field] || cond.field;
  const operator = OPERATOR_LABELS[cond.operator] || cond.operator || "";
  const value = formatConditionValue(cond.value);
  return `${field} ${operator ? operator + " " : ""}» ${value}`;
};

// בונה תיאור רקורסיבי לכל העץ (QueryGroup) לטקסט אחד
const describeQuery = (group: QueryGroup): string => {
  const parts: string[] = [];

  (group.conditions || []).forEach((cond) => {
    parts.push(describeCondition(cond));
  });

  (group.groups || []).forEach((g) => {
    const inner = describeQuery(g);
    if (inner) parts.push(`(${inner})`);
  });

  const logicLabel = group.logic === "OR" ? "או" : "וגם";
  return parts.join(`  ${logicLabel}  `);
};

const CourseContent = () => {
  const [filterOption, setfilterOption] = useState<string>("operational");
  const [selectedOption, setSelectedOption] = useState<number>(1);
  const [query, setQuery] = useState<QueryGroup | null>(null);
  const [visible, setVisible] = useState(false);
  const showDrawer = () => {
    setVisible(true);
  };
  const onClose = () => {
    setVisible(false);
  };


  const { setTasks, next, prev, reset, currentIndex, taskIds } = useSearchNavStore();

  const { filteredCourses } = useFilteredDataStore();
  const { axisBatchArchive } = useCourseBatchStore();

 
  
  const {
    selectedCourse,
    selectedTeam,
    activeHeaderType,
    selectedTeamMember,
    selectedCourseBatch,
  } = useSelectionsStore();
  const { selectedPermission } = usePermissionStore();

  const { data: searchResults, isLoading } = useAdvancedSearch(
    query,
    selectedCourseBatch?.id,
    activeHeaderType !== "domain" ? selectedTeam?.id ?? null : null,
    filterOption,
    true
  );

  

  const handleSearch = useCallback((newQuery: QueryGroup | null) => {
    setQuery(newQuery);
    onClose();
  }, []);

  const handleSelectChange = useCallback((value: string) => {
    setfilterOption(value);
  }, []);


   const isQueryActive = useCallback((q: QueryGroup | null): boolean => {
    if (!q) return false;
    const hasConditionValue = (q.conditions || []).some((c) => c.value !== "" && c.value !== null && c.value !== undefined && !(Array.isArray(c.value) && c.value.length === 0));
    const hasNestedQuery = (q.groups || []).some((g) => isQueryActive(g));
    return hasConditionValue || hasNestedQuery;
  }, []);

  const queryActive = isQueryActive(query);

  const handleReset = useCallback(() => {
    setQuery(null);
  }, []);

const querySummary = useMemo(() => {
  if (!query) return "";
  return describeQuery(query);
}, [query]);

useEffect(() => {
  if (!queryActive || !searchResults) {
    reset();
    return;
  }

  let cancelled = false;

  const collect = () => {
    if (cancelled) return;

    // אוסף לפי סדר הופעתם על המסך (ציר → קבוצת משימות → משימה)
    const ids: string[] = [];
    document
      .querySelectorAll("[data-nav-task-id]")
      .forEach((node) => {
        const raw = node.getAttribute("data-nav-task-id");
        if (raw) ids.push(raw);  
      });

    // הסרת כפילויות (עכשיו מאותו טיפוס - עובד נכון)
    const uniqueIds = ids.filter((id, i) => ids.indexOf(id) === i);

    
    setTasks(uniqueIds);
  };

  // רשת ביטחון לרינדור אסינכרוני של הילדים
  const frame = requestAnimationFrame(() => collect());
  const timer = setTimeout(collect, 200);

  return () => {
    cancelled = true;
    cancelAnimationFrame(frame);
    clearTimeout(timer);
  };
}, [queryActive, searchResults, setTasks, reset]);

// ── האזנה למקשים: חץ ימין = הבא, חץ שמאל = הקודם ──
useEffect(() => {
  if (!queryActive) return;

  const handler = (e: KeyboardEvent) => {
    // לא להפריע אם המשתמש מקליד בתוך input/textarea/select
    const target = e.target as HTMLElement;
    if (target.closest("input, textarea, select, [contenteditable='true']")) {
      return;
    }

   if (e.key === "ArrowLeft") {       // ← שמאלה = הבא (בכיוון הקריאה בעברית)
  e.preventDefault();
  next();
} else if (e.key === "ArrowRight") {  // ← ימינה = הקודם
  e.preventDefault();
  prev();
}
  };

  window.addEventListener("keydown", handler);
  return () => window.removeEventListener("keydown", handler);
}, [queryActive, next, prev]);

  return (
    <div className={style["container"]}>
      <div className={style["header-container"]}>
        <HeaderPermissionDisplay />
        <div className={style["select-options"]}>

             {queryActive && (
 <div className={style.queryBanner}>

  <div className={style.queryBannerText}>
    <span className={style.queryBannerTitle}>שאילתה פעילה</span>

       <span
    className={`${style.queryBannerCounter} ${
      taskIds.length === 0 ? style.queryBannerCounterEmpty : ""
    } ${style.counterChanged ? style.queryBannerCounterUpdated : ""}`}
  >
    {taskIds.length > 0 ? `${currentIndex + 1} / ${taskIds.length}` : "0 / 0"}
  </span>

    {querySummary && (
      <span className={style.queryBannerSummary} dir="rtl">
        {querySummary}
      </span>
    )}
  </div>
    <div className={style.queryBannerNav}>
      <Tooltip title="הקודם ">
        <button
          type="button"
          className={style.queryBannerArrow}
          onClick={prev}
          disabled={taskIds.length === 0}
          aria-label="הקודם"
        >
          <ArrowRightOutlined />
        </button>
      </Tooltip>

      <Tooltip title="הבא ">
        <button
          type="button"
          className={style.queryBannerArrow}
          onClick={next}
          disabled={taskIds.length === 0}
          aria-label="הבא"
        >
          <ArrowLeftOutlined />
        </button>
      </Tooltip>
    </div>

 <Tooltip title="איפוס שאילתה">
  <Button
    size="small"
    type="text"
    icon={<CloseOutlined />}
    onClick={handleReset}
    className={style.queryBannerReset}
    style={{
      color: "#4f46e5",
      fontWeight: 600,
      border: "1px solid #c7d2fe",
      borderRadius: "8px",
      padding: "2px 10px",
      display: "inline-flex",
      alignItems: "center",
      gap: 6,
      fontSize: 12,
    }}
  >
    איפוס שאילתה
  </Button>
</Tooltip>
</div>
)}

          {!selectedTeamMember && (
            <CircularSelect
              options={options}
              defaultValue="operational"
              onChange={handleSelectChange}
              width={120}
              size="middle"
            />
          )}
          {activeHeaderType !== "teamMember" && (
            <Tooltip placement="bottom" title={"חיפוש מתקדם"}>
              <Button
                icon={<FileSearchOutlined />}
                type="primary"
                onClick={showDrawer}
              />
            </Tooltip>
          )}
        </div>
      </div>

      {filteredCourses.length > 0 ? (
        <>



          <div className={style["switchContainer"]}>
            <span style={{ fontSize: 28, color: "#3A547F" }}>
              גאנט{" "}
              {activeHeaderType === "teamMember"
                ? selectedTeamMember?.name || selectedTeamMember?.User?.name
                : activeHeaderType !== "team"
                ? selectedCourse?.name
                : selectedTeam?.name || null}
            </span>
            {selectedPermission?.role_code !== "STUDENT" && (
              <GenericOptionSwitch
                SwitchContainerLabelStyle={{
                  display: "flex",
                  alignItems: "center",
                  gap: "8px",
                  padding: "4px",
                  backgroundColor: "#bfac8b",
                  borderRadius: "20px",
                  width: "fit-content",
                  height: "100%",
                }}
                OptionLabelStyle={{
                  padding: "4px 52px",
                  borderRadius: "16px",
                  fontSize: "14px",
                  cursor: "pointer",
                  transition: " all 0.2s ease",
                }}
                options={optionsLabel}
                selectedOption={selectedOption}
                setSelectedOption={setSelectedOption}
              />
            )}
          </div>
          <AxisBoard
            axesData={axisBatchArchive}
            filterOption={filterOption}
            selectedOption={selectedOption}
            searchResults={searchResults}
          />
        </>
      ) : (
        <h2>גאנט קורס לא קיים - יש ליצור קורס</h2>
      )}


      <Drawer
        title="בניית שאילתא"
        placement="right"
        closable={false}
        onClose={onClose}
        open={visible}
        width={550}
      >
        <QueryBuilder
          onSearch={handleSearch}
          searchResults={searchResults}
          isLoading={isLoading}
          filterOption={filterOption}
        />
      </Drawer>
    </div>
  );
};

export default CourseContent;
