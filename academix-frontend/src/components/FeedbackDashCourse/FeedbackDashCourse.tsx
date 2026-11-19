import React, { useEffect, useMemo, useState } from "react";
import dayjs, { Dayjs } from "dayjs";
import ScoreChartUserForms from "../DashboardUserForms/ScoreChartUserForms/ScoreChartUserForms";
import { useFetchFeedbacksByCourseId } from "../../hooks/feedback/useFetchFeedbackByCourseId";
import { useFetchFeedbacksByTeamId } from "../../hooks/feedback/useFetchFeedbackByTeamId";
import FeedbackCategoryChar from "../FeedbackCategoryChar/FeedbackCategoryChar";
import FeedbackDashFilter from "./FeedbackDashFilter/FeedbackDashFilter";

import { useSelectionsStore } from "../../store/selectionStore";
import FeedbackFilters from "./FeedbackFilter/FeedbackFilter";
import FeedBackDashByTeam from "./FeedBackDashByTeam/FeedBackDashByTeam";

const STORAGE_KEYS = {
  timeFilter: "feedbackDashboard.timeFilter",
  statusFilter: "feedbackDashboard.statusFilter",
  searchTerm: "feedbackDashboard.searchTerm",
  dateSort: "feedbackDashboard.dateSort",
  dateRange: "feedbackDashboard.dateRange",
};

type DateRange = [Dayjs | null, Dayjs | null] | null;

function loadDateRange(): DateRange {
  try {
    const raw = sessionStorage.getItem(STORAGE_KEYS.dateRange);
    if (!raw) return null;

    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed) && parsed[0] && parsed[1]) {
      return [dayjs(parsed[0]), dayjs(parsed[1])];
    }
  } catch {
    // ignore
  }

  return null;
}

const FeedbackDashCourse = () => {
  const { selectedCourse, selectedCourseBatch, selectedTeam } =
    useSelectionsStore();

  // === פילטרים גלובליים ===
  const [timeFilter, setTimeFilter] = useState<string>(
    () => sessionStorage.getItem(STORAGE_KEYS.timeFilter) || "1"
  );

  const [statusFilter, setStatusFilter] = useState<string>(
    () => sessionStorage.getItem(STORAGE_KEYS.statusFilter) || "all"
  );

  const [searchTerm, setSearchTerm] = useState<string>(
    () => sessionStorage.getItem(STORAGE_KEYS.searchTerm) || ""
  );

  const [dateSort, setDateSort] = useState<string>(
    () => sessionStorage.getItem(STORAGE_KEYS.dateSort) || "all"
  );

  const [dateRange, setDateRange] = useState<DateRange>(() => {
    if (sessionStorage.getItem(STORAGE_KEYS.dateSort) !== "date-picker") {
      return null;
    }
    return loadDateRange();
  });

  useEffect(() => {
    sessionStorage.setItem(STORAGE_KEYS.timeFilter, timeFilter);
  }, [timeFilter]);

  useEffect(() => {
    sessionStorage.setItem(STORAGE_KEYS.statusFilter, statusFilter);
  }, [statusFilter]);

  useEffect(() => {
    sessionStorage.setItem(STORAGE_KEYS.searchTerm, searchTerm);
  }, [searchTerm]);

  useEffect(() => {
    sessionStorage.setItem(STORAGE_KEYS.dateSort, dateSort);
  }, [dateSort]);

  useEffect(() => {
    if (dateSort === "date-picker" && dateRange?.[0] && dateRange?.[1]) {
      sessionStorage.setItem(
        STORAGE_KEYS.dateRange,
        JSON.stringify([dateRange[0].toISOString(), dateRange[1].toISOString()])
      );
    } else {
      sessionStorage.removeItem(STORAGE_KEYS.dateRange);
    }
  }, [dateSort, dateRange]);

  const teamId = selectedTeam?.id;

  // === שליפת כל הפידבקים (כולל תשובות וציונים) ===
  const {
    data: allFeedbacks,
    isLoading: isLoadingFeedbacks,
    isError,
    error,
  } = useFetchFeedbacksByCourseId(
    selectedCourse?.id,
    selectedCourseBatch?.id,
    teamId
  );

  // === שליפת כל המשימות של הצוות ===
  const { data: allTeamTasks, isLoading: isLoadingTasks } =
    useFetchFeedbacksByTeamId(teamId, selectedCourseBatch?.id, "4");

  // === סינון משימות לפי כל הפילטרים ===
  const filteredTasks = useMemo(() => {
    if (!allTeamTasks || allTeamTasks.length === 0) return [];

    const now = dayjs();
    const startOfToday = now.startOf("day");
    const endOfToday = now.endOf("day");
    const startOfWeek = now.startOf("week");

    let result = [...allTeamTasks];

    // 1. סינון לפי הטאב (היום / השבוע / עתידיות / הכל)
    if (timeFilter === "0") {
      result = result.filter((task: any) =>
        task.assignments?.some((a: any) =>
          dayjs(a.start).isSame(startOfToday, "day")
        )
      );
    } else if (timeFilter === "1") {
      result = result.filter((task: any) =>
        task.assignments?.some((a: any) =>
          dayjs(a.start).isSame(startOfWeek, "week")
        )
      );
    } else if (timeFilter === "2") {
      result = result.filter((task: any) =>
        task.assignments?.some((a: any) => dayjs(a.start).isAfter(endOfToday))
      );
    }

    // 2. סינון assignments בתוך כל משימה שנשארה – כדי שיישארו רק אלו שתואמים לטאב
    result = result.map((task: any) => ({
      ...task,
      assignments: (task.assignments || []).filter((a: any) => {
        if (timeFilter === "0")
          return dayjs(a.start).isSame(startOfToday, "day");
        if (timeFilter === "1")
          return dayjs(a.start).isSame(startOfWeek, "week");
        if (timeFilter === "2") return dayjs(a.start).isAfter(endOfToday);
        return true;
      }),
    }));

    // 3. סינון לפי טווח תאריכים (dateRange)
    if (dateRange && dateRange[0] && dateRange[1]) {
      const startDate = dateRange[0].startOf("day");
      const endDate = dateRange[1].endOf("day");

      result = result.filter((task: any) =>
        task.assignments?.some((a: any) => {
          const taskDate = dayjs(a.start);
          return (
            (taskDate.isSame(startDate, "day") ||
              taskDate.isAfter(startDate)) &&
            (taskDate.isSame(endDate, "day") || taskDate.isBefore(endDate))
          );
        })
      );

      // מסננים גם את ה-assignments עצמם לפי הטווח
      result = result.map((task: any) => ({
        ...task,
        assignments: (task.assignments || []).filter((a: any) => {
          const taskDate = dayjs(a.start);
          const startLocal = dateRange[0]!.startOf("day");
          const endLocal = dateRange[1]!.endOf("day");
          return (
            (taskDate.isSame(startLocal, "day") ||
              taskDate.isAfter(startLocal)) &&
            (taskDate.isSame(endLocal, "day") || taskDate.isBefore(endLocal))
          );
        }),
      }));
    }

    // 4. חיפוש חופשי
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      result = result.filter(
        (task: any) =>
          task.taskName?.toLowerCase().includes(term) ||
          task.feedback?.name?.toLowerCase().includes(term)
      );
    }

    // 5. סינון לפי סטטוס
    if (statusFilter !== "all") {
      switch (statusFilter) {
        case "submitted":
          result = result.filter(
            (task: any) =>
              Number(task.countOfAssignments) === Number(task.countOfAnswers)
          );
          break;
        case "awaiting":
          result = result.filter(
            (task: any) =>
              Number(task.countOfAssignments) !== Number(task.countOfAnswers) &&
              Number(task.countOfAnswers) !== 0
          );
          break;
        case "no-response":
          result = result.filter(
            (task: any) =>
              Number(task.countOfAssignments) > 0 &&
              Number(task.countOfAnswers) === 0
          );
          break;
      }
    }

    // 6. מיון לפי תאריך
    if (dateSort === "new-to-old") {
      result.sort(
        (a: any, b: any) =>
          dayjs(b.assignments?.[0]?.start).valueOf() -
          dayjs(a.assignments?.[0]?.start).valueOf()
      );
    } else if (dateSort === "old-to-new") {
      result.sort(
        (a: any, b: any) =>
          dayjs(a.assignments?.[0]?.start).valueOf() -
          dayjs(b.assignments?.[0]?.start).valueOf()
      );
    }

    return result;
  }, [allTeamTasks, timeFilter, statusFilter, searchTerm, dateSort, dateRange]);

  // === בניית הפידבקים המסונכרנים לגרפים ===
  const synchronizedFeedbacks = useMemo(() => {
    if (!allFeedbacks || filteredTasks.length === 0) return [];

    const groupedMap = new Map<number, any>();

    filteredTasks.forEach((task: any) => {
      const feedbackId = task.feedback?.id;
      if (!feedbackId) return;

      // כל ה-assignment IDs של המשימה המסוננת
      const assignmentIds = new Set(
        (task.assignments || []).map((a: any) => Number(a.id))
      );

      // הפידבק המלא מהשליפה השניה
      const fullFeedback = allFeedbacks.find(
        (f: any) => Number(f.feedbackId) === Number(feedbackId)
      );

      // רק התשובות ששייכות למשימות המסוננות
      const answers = (fullFeedback?.answers || []).filter((answer: any) =>
        assignmentIds.has(Number(answer.taskAssignmentId))
      );

      // הקטגוריות מהשליפה הראשונה
      const categories = task.feedback?.categories || [];

      // אם זו הפעם הראשונה שהמשוב הזה מופיע – יוצר קבוצה חדשה
      if (!groupedMap.has(Number(feedbackId))) {
        groupedMap.set(Number(feedbackId), {
          feedbackId: Number(feedbackId),
          feedbackName: task.feedback?.name || `משוב ${feedbackId}`,
          categories: [],
          answers: [],
        });
      }

      const group = groupedMap.get(Number(feedbackId));

      // מיזוג קטגוריות – מחבר את ה-counts אם שם הקטגוריה כבר קיים
      categories.forEach((cat: any) => {
        const existing = group.categories.find(
          (c: any) => c.categoryName === cat.categoryName
        );
        if (existing) {
          existing.counts = {
            improvement:
              (existing.counts?.improvement || 0) +
              (cat.counts?.improvement || 0),
            preservation:
              (existing.counts?.preservation || 0) +
              (cat.counts?.preservation || 0),
          };
        } else {
          group.categories.push({
            categoryName: cat.categoryName,
            counts: {
              improvement: cat.counts?.improvement || 0,
              preservation: cat.counts?.preservation || 0,
            },
          });
        }
      });

      // הוספת כל התשובות של אותה משימה
      group.answers.push(...answers);
    });

    // מחזיר רק פידבקים שיש להם לפחות קטגוריה או תשובה
    return Array.from(groupedMap.values()).filter(
      (f: any) => f.answers.length > 0 || f.categories.length > 0
    );
  }, [filteredTasks, allFeedbacks]);

  if (isLoadingFeedbacks || isLoadingTasks) {
    return (
      <div>
        <p>טוען משובים...</p>
      </div>
    );
  }

  if (isError) {
    return (
      <div>
        <p>שגיאה בטעינת המשובים: {error?.message || "Unknown error"}</p>
      </div>
    );
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", paddingTop: 15 }}>
      {/* <h3>
        דאשבורד{" "}
        {selectedTeam?.name
          ? ` - ${selectedTeam.name}`
          : ` - ${selectedCourse?.name}`}
      </h3> */}
  
      {/* הפילטרים והטאבים – למעלה ומשפיעים על הכל */}
      <FeedbackFilters
        timeFilter={timeFilter}
        setTimeFilter={setTimeFilter}
        statusFilter={statusFilter}
        setStatusFilter={setStatusFilter}
        searchTerm={searchTerm}
        setSearchTerm={setSearchTerm}
        dateSort={dateSort}
        setDateSort={setDateSort}
        dateRange={dateRange}
        setDateRange={setDateRange}
      />
      {/* הגרפים – מסונכרנים עם הפילטרים */}
      <div
        style={{
          display: "flex",
          height: "25vh",
          gap: "16px",
          paddingBottom: 15,
        }}
      >
        <FeedbackCategoryChar feedbacks={synchronizedFeedbacks} />
        <ScoreChartUserForms forms={null} feedbacks={synchronizedFeedbacks} />
      </div>

      {/* המשימות המסוננות */}
      <FeedBackDashByTeam tasks={filteredTasks} />

      {/* מאגר התבניות – נשאר כמו שהוא */}
      <FeedbackDashFilter feedbacks={allFeedbacks || []} />
    </div>
  );
};

export default FeedbackDashCourse;
