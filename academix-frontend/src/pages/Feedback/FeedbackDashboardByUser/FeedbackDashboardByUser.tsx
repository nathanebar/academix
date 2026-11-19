import React, { useState, useMemo, useEffect } from "react";
import FormFiltersAndList from "../../../components/DashboardUserForms/FormFiltersAndList/FormFiltersAndList";
import FeedbackCategoryChar from "../../../components/FeedbackCategoryChar/FeedbackCategoryChar";
import { useFetchFeedbackByUserId } from "../../../hooks/feedback/useFetchFeedbackByUser";
import { usePermissionStore } from "../../../store/permissionStore";
import { useSelectionsStore } from "../../../store/selectionStore";
import { feedbackType } from "../../../types/types";
import { Input, Select, Tag, Button, DatePicker } from "antd";
import {
  SearchOutlined,
  CloseCircleFilled,
  DownOutlined,
  RightOutlined,
  CloseCircleOutlined,
} from "@ant-design/icons";
import stringCheckAndToolTip from "../../../utils/stringCheck";
import style from "./FeedbackDashboardByUser.module.css";
import dayjs, { Dayjs } from "dayjs";

const { RangePicker } = DatePicker;
const { Option } = Select;

type TaskStatusFilter = "all" | "in_progress" | "submitted" | "approved";

// ==================== STORAGE KEYS ====================
const STORAGE_KEYS = {
  activeTagId: "feedbackDashboardByUser.activeTagId",
  activeAxisId: "feedbackDashboardByUser.activeAxisId",
  searchTerm: "feedbackDashboardByUser.searchTerm",
  sortBy: "feedbackDashboardByUser.sortBy",
  statusFilter: "feedbackDashboardByUser.statusFilter",
  taskStatusFilter: "feedbackDashboardByUser.taskStatusFilter",
  dateRange: "feedbackDashboardByUser.dateRange",
};

const mergeFeedbacks = (feedbacks: feedbackType[]): feedbackType[] => {
  const merged: feedbackType[] = [];

  for (const fb of feedbacks) {
    let acc = merged.find((item) => item.feedbackId === fb.feedbackId);

    if (!acc) {
      acc = {
        ...fb,
        answers: [] as typeof fb.answers,
        categories: [] as typeof fb.categories,
      };
      merged.push(acc);
    }

    for (const cat of fb.categories ?? []) {
      const existingCat = acc.categories.find(
        (c) => c.categoryName === cat.categoryName
      );

      if (existingCat) {
        existingCat.counts.improvement =
          (existingCat.counts.improvement || 0) + (cat.counts.improvement || 0);
        existingCat.counts.preservation =
          (existingCat.counts.preservation || 0) +
          (cat.counts.preservation || 0);
      } else {
        acc.categories.push({
          categoryName: cat.categoryName,
          counts: { ...cat.counts },
        });
      }
    }

    acc.answers.push(...(fb.answers ?? []));
  }

  return merged;
};

const getCategoryTags = (
  feedbacks: feedbackType[]
): { title: string; color: string }[] => {
  const allCategories = new Set<string>();
  feedbacks.forEach((fb) => {
    fb.categories?.forEach((cat) => {
      allCategories.add(cat.categoryName);
    });
  });

  const categoryTags = Array.from(allCategories).map((name) => ({
    title: name,
    color: "#E6e1d8",
  }));

  return [{ title: "הכל", color: "" }, ...categoryTags];
};

const getAxisTags = (
  feedbacks: feedbackType[]
): { title: string; color: string }[] => {
  const allAxes = new Set<string>();
  feedbacks.forEach((fb) => {
    if (fb.axis?.name) {
      allAxes.add(fb.axis.name);
    }
  });

  return Array.from(allAxes).map((name) => ({
    title: name,
    color:
      feedbacks.find((fb) => fb.axis?.name === name)?.axis?.color || "#E6e1d8",
  }));
};

const loadDateRange = (): [Dayjs | null, Dayjs | null] => {
  try {
    const raw = sessionStorage.getItem(STORAGE_KEYS.dateRange);
    if (!raw) return [null, null];
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed) && parsed.length === 2) {
      return [
        parsed[0] ? dayjs(parsed[0]) : null,
        parsed[1] ? dayjs(parsed[1]) : null,
      ];
    }
  } catch {
    // ignore
  }
  return [null, null];
};

const FeedbackDashboardByUser = () => {
  const { selectedTeamMember } = useSelectionsStore();
  const { selectedPermission } = usePermissionStore();

  // ==================== STATE של הפילטרים (מתוך sessionStorage) ====================
  const [activeTagId, setActiveTagId] = useState<number>(() => {
    const stored = sessionStorage.getItem(STORAGE_KEYS.activeTagId);
    return stored ? parseInt(stored, 10) || 0 : 0;
  });

  const [activeAxisId, setActiveAxisId] = useState<number>(() => {
    const stored = sessionStorage.getItem(STORAGE_KEYS.activeAxisId);
    return stored ? parseInt(stored, 10) || 0 : 0;
  });

  const [searchTerm, setSearchTerm] = useState<string>(() => {
    return sessionStorage.getItem(STORAGE_KEYS.searchTerm) || "";
  });

  const [sortBy, setSortBy] = useState<string>(() => {
    return sessionStorage.getItem(STORAGE_KEYS.sortBy) || "new";
  });

  const [statusFilter, setStatusFilter] = useState<string>(() => {
    return sessionStorage.getItem(STORAGE_KEYS.statusFilter) || "all";
  });

  const [taskStatusFilter, setTaskStatusFilter] = useState<TaskStatusFilter>(
    () => {
      const stored = sessionStorage.getItem(STORAGE_KEYS.taskStatusFilter);
      return (stored as TaskStatusFilter) || "all";
    }
  );

  const [dateRange, setDateRange] = useState<[Dayjs | null, Dayjs | null]>(
    () => {
      return loadDateRange();
    }
  );
  // ==================== איפוס כשמחליפים חניך ====================
  const selectedTeamMemberId = selectedTeamMember?.id;

  useEffect(() => {
    setActiveTagId(0);
    setActiveAxisId(0);
  }, [selectedTeamMemberId]);
  // ==================== שמירה ב-sessionStorage ====================
  useEffect(() => {
    sessionStorage.setItem(STORAGE_KEYS.activeTagId, String(activeTagId));
  }, [activeTagId]);

  useEffect(() => {
    sessionStorage.setItem(STORAGE_KEYS.activeAxisId, String(activeAxisId));
  }, [activeAxisId]);

  useEffect(() => {
    sessionStorage.setItem(STORAGE_KEYS.searchTerm, searchTerm);
  }, [searchTerm]);

  useEffect(() => {
    sessionStorage.setItem(STORAGE_KEYS.sortBy, sortBy);
  }, [sortBy]);

  useEffect(() => {
    sessionStorage.setItem(STORAGE_KEYS.statusFilter, statusFilter);
  }, [statusFilter]);

  useEffect(() => {
    sessionStorage.setItem(STORAGE_KEYS.taskStatusFilter, taskStatusFilter);
  }, [taskStatusFilter]);

  useEffect(() => {
    if (dateRange[0] && dateRange[1]) {
      sessionStorage.setItem(
        STORAGE_KEYS.dateRange,
        JSON.stringify([dateRange[0].toISOString(), dateRange[1].toISOString()])
      );
    } else {
      sessionStorage.removeItem(STORAGE_KEYS.dateRange);
    }
  }, [dateRange]);

  // ==================== STATE של COLLAPSIBLE ====================
  const [isAxisExpanded, setIsAxisExpanded] = useState<boolean>(false);
  const [isCategoryExpanded, setIsCategoryExpanded] = useState<boolean>(false);

  // ==================== STATE של הגדלת רשימת המשובים ====================
  const [isListExpanded, setIsListExpanded] = useState<boolean>(false);

  const clearDateFilter = () => setDateRange([null, null]);
  const { data, isLoading, isError, error } = useFetchFeedbackByUserId(
    selectedTeamMember?.id,
    selectedPermission?.role_code
  );

  const categoryTags = useMemo(() => getCategoryTags(data ?? []), [data]);
  const axisTags = useMemo(() => getAxisTags(data ?? []), [data]);

  const clearAxisFilter = () => setActiveAxisId(0);
  const clearTagFilter = () => setActiveTagId(0);
  const clearTaskStatusFilter = () => setTaskStatusFilter("all");
  const clearStatusFilter = () => setStatusFilter("all");
  const clearSearch = () => setSearchTerm("");
  const clearSortBy = () => setSortBy("new");

  const clearAllFilters = () => {
    setActiveTagId(0);
    setActiveAxisId(0);
    setSearchTerm("");
    setSortBy("new");
    setStatusFilter("all");
    setTaskStatusFilter("all");
    setDateRange([null, null]);
  };

  const hasActiveFilters =
    activeAxisId > 0 ||
    activeTagId > 0 ||
    searchTerm !== "" ||
    statusFilter !== "all" ||
    taskStatusFilter !== "all" ||
    (dateRange[0] !== null && dateRange[1] !== null);

  // ==================== פילטור הנתונים ====================
  const filteredData = useMemo(() => {
    let result: feedbackType[] = [...(data ?? [])];

    if (dateRange && dateRange[0] && dateRange[1]) {
      const startDate = dateRange[0].startOf("day");
      const endDate = dateRange[1].endOf("day");

      result = result.filter((item) => {
        if (!item.taskAssignmentsStart) return false;
        const itemDate = dayjs(item.taskAssignmentsStart);
        return (
          (itemDate.isSame(startDate, "day") || itemDate.isAfter(startDate)) &&
          (itemDate.isSame(endDate, "day") || itemDate.isBefore(endDate))
        );
      });
    }

    if (activeTagId > 0) {
      const selectedCategory = categoryTags[activeTagId]?.title;
      result = result.filter((item) =>
        item.categories?.some(
          (cat) =>
            cat.categoryName === selectedCategory &&
            ((cat.counts.improvement ?? 0) !== 0 ||
              (cat.counts.preservation ?? 0) !== 0)
        )
      );
    }

    if (activeAxisId > 0) {
      const selectedAxis = axisTags[activeAxisId - 1]?.title;
      if (selectedAxis) {
        result = result.filter((item) => item.axis?.name === selectedAxis);
      }
    }

    if (taskStatusFilter !== "all") {
      result = result.filter((item) => {
        const isCompleted = item.taskCompleted != null;
        const isSubmitted = item.taskCompleted_at != null;

        switch (taskStatusFilter) {
          case "in_progress":
            return !isSubmitted && !isCompleted;
          case "submitted":
            return isSubmitted && !isCompleted;
          case "approved":
            return isCompleted;
          default:
            return true;
        }
      });
    }

    if (statusFilter !== "all") {
      switch (statusFilter) {
        case "submitted":
          result = result.filter(
            (feedback) => feedback.answers && feedback.answers.length > 0
          );
          break;
        case "awaiting":
          result = result.filter(
            (feedback) => !feedback.answers || feedback.answers.length === 0
          );
          break;
      }
    }

    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      result = result.filter(
        (item) =>
          item.feedbackName?.toLowerCase().includes(term) ||
          item.taskName?.toLowerCase().includes(term)
      );
    }

    switch (sortBy) {
      case "new":
        result.sort(
          (a, b) =>
            new Date(b.taskAssignmentsStart ?? 0).getTime() -
            new Date(a.taskAssignmentsStart ?? 0).getTime()
        );
        break;
      case "old":
        result.sort(
          (a, b) =>
            new Date(a.taskAssignmentsStart ?? 0).getTime() -
            new Date(b.taskAssignmentsStart ?? 0).getTime()
        );
        break;
      case "hight":
      case "low":
        result.sort((a, b) => {
          const avgGradeA =
            a.answers?.length > 0
              ? a.answers.reduce(
                  (sum, ans) => sum + (ans.summary_grade || 0),
                  0
                ) / a.answers.length
              : 0;
          const avgGradeB =
            b.answers?.length > 0
              ? b.answers.reduce(
                  (sum, ans) => sum + (ans.summary_grade || 0),
                  0
                ) / b.answers.length
              : 0;
          return sortBy === "hight"
            ? avgGradeB - avgGradeA
            : avgGradeA - avgGradeB;
        });
        break;
    }

    return result;
  }, [
    data,
    activeTagId,
    activeAxisId,
    searchTerm,
    sortBy,
    statusFilter,
    taskStatusFilter,
    categoryTags,
    axisTags,
    dateRange,
  ]);

  const chartData = useMemo(() => mergeFeedbacks(filteredData), [filteredData]);

  // ==================== פונקציות ספירה ====================
  const getTagCount = (tagIndex: number): number => {
    if (tagIndex === 0) return (data ?? []).length;
    const category = categoryTags[tagIndex]?.title;
    return (data ?? []).filter((fb: any) =>
      fb.categories?.some((cat: any) => cat.categoryName === category)
    ).length;
  };

  const getAxisTagCount = (axisIndex: number): number => {
    if (axisIndex === 0) return (data ?? []).length;
    const axisName = axisTags[axisIndex - 1]?.title;
    if (!axisName) return 0;
    return (data ?? []).filter((fb: any) => fb.axis?.name === axisName).length;
  };

  const getStatusCounts = () => {
    const allData = data ?? [];
    return {
      all: allData.length,
      in_progress: allData.filter((fb: any) => {
        const isSubmitted = fb.taskCompleted_at != null;
        const isCompleted = fb.taskCompleted != null;
        return !isSubmitted && !isCompleted;
      }).length,
      submitted: allData.filter((fb: any) => {
        const isSubmitted = fb.taskCompleted_at != null;
        const isCompleted = fb.taskCompleted != null;
        return isSubmitted && !isCompleted;
      }).length,
      approved: allData.filter((fb: any) => {
        return fb.taskCompleted != null;
      }).length,
    };
  };

  const getFeedbackStatusCounts = () => {
    const allData = data ?? [];
    return {
      all: allData.length,
      submitted: allData.filter(
        (fb: any) => fb.answers && fb.answers.length > 0
      ).length,
      awaiting: allData.filter(
        (fb: any) => !fb.answers || fb.answers.length === 0
      ).length,
    };
  };

  if (isLoading) {
    return <div className={style.container}>טוען משובים...</div>;
  }
  if (!data) {
    return <div className={style.container}>יש לבחור חבר צוות</div>;
  }
  if (isError) {
    return (
      <div className={style.container}>
        <p>שגיאה: {error?.message}</p>
      </div>
    );
  }
  if (data?.length === 0) {
    return (
      <div className={style.container}>
        <h2>משובים אחרונים</h2>
        <h3 style={{ color: "GrayText" }}>לא קיימים משובים</h3>
      </div>
    );
  }

  const statusCounts = getStatusCounts();
  const feedbackStatusCounts = getFeedbackStatusCounts();

  return (
    <div className={style.container}>
      <div className={style.content}>
        {/* פילטרים בראש העמוד */}
        <div className={style.filtersTop}>
          {/* סינון לפי ציר - COLLAPSIBLE */}
          {axisTags.length > 0 && (
            <div className={style.filterSection}>
              <div
                className={`${style.collapsibleHeader} ${
                  activeAxisId > 0 ? style.collapsibleHeaderActive : ""
                }`}
                onClick={() => setIsAxisExpanded(!isAxisExpanded)}
              >
                <div className={style.collapsibleTitle}>
                  {isAxisExpanded ? (
                    <DownOutlined className={style.collapseIcon} />
                  ) : (
                    <RightOutlined className={style.collapseIcon} />
                  )}
                  <span
                    className={`${style.filterLabel} ${
                      activeAxisId > 0 ? style.filterLabelActive : ""
                    }`}
                  >
                    פילטור לפי ציר :
                    {activeAxisId > 0 && (
                      <span className={style.activeFilterName}>
                        {axisTags[activeAxisId - 1]?.title}
                      </span>
                    )}
                  </span>
                </div>
                <div className={style.collapsibleActions}>
                  <span className={style.filterCount}>
                    {axisTags.length + 1} אפשרויות
                  </span>
                  {activeAxisId > 0 && (
                    <Button
                      type="text"
                      size="small"
                      icon={<CloseCircleFilled />}
                      onClick={(e) => {
                        e.stopPropagation();
                        clearAxisFilter();
                      }}
                      className={style.clearBtn}
                    >
                      הסר
                    </Button>
                  )}
                </div>
              </div>

              <div
                className={`${style.collapsibleContent} ${
                  isAxisExpanded ? style.collapsibleContentOpen : ""
                }`}
              >
                <div className={style.tagsRow}>
                  <Tag
                    key="axis-all"
                    className={`${style.tag} ${
                      activeAxisId === 0 ? style.tagActive : ""
                    }`}
                    style={{
                      backgroundColor: activeAxisId === 0 ? "white" : "#E6e1d8",
                    }}
                    onClick={() => setActiveAxisId(0)}
                  >
                    כל הצירים ({getAxisTagCount(0)})
                  </Tag>
                  {axisTags.map((value, index) => (
                    <Tag
                      key={`axis-${index}`}
                      className={`${style.tag} ${
                        activeAxisId === index + 1 ? style.tagActive : ""
                      }`}
                      style={{
                        backgroundColor:
                          activeAxisId === index + 1 ? "white" : "#E6e1d8",
                        border:
                          activeAxisId === index + 1
                            ? `2px solid ${value.color || "#1890ff"}`
                            : `1px solid ${value.color || "#d9d9d9"}`,
                      }}
                      onClick={() => setActiveAxisId(index + 1)}
                    >
                      {stringCheckAndToolTip(value?.title.trim(), 20)} (
                      {getAxisTagCount(index + 1)})
                    </Tag>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* סינון לפי קטגוריה - COLLAPSIBLE */}
          <div className={style.filterSection}>
            <div
              className={`${style.collapsibleHeader} ${
                activeTagId > 0 ? style.collapsibleHeaderActive : ""
              }`}
              onClick={() => setIsCategoryExpanded(!isCategoryExpanded)}
            >
              <div className={style.collapsibleTitle}>
                {isCategoryExpanded ? (
                  <DownOutlined className={style.collapseIcon} />
                ) : (
                  <RightOutlined className={style.collapseIcon} />
                )}
                <span
                  className={`${style.filterLabel} ${
                    activeTagId > 0 ? style.filterLabelActive : ""
                  }`}
                >
                  פילטור לפי קטגוריה :
                  {activeTagId > 0 && (
                    <span className={style.activeFilterName}>
                      {categoryTags[activeTagId]?.title}
                    </span>
                  )}
                </span>
              </div>
              <div className={style.collapsibleActions}>
                <span className={style.filterCount}>
                  {categoryTags.length} אפשרויות
                </span>
                {activeTagId > 0 && (
                  <Button
                    type="text"
                    size="small"
                    icon={<CloseCircleFilled />}
                    onClick={(e) => {
                      e.stopPropagation();
                      clearTagFilter();
                    }}
                    className={style.clearBtn}
                  >
                    הסר
                  </Button>
                )}
              </div>
            </div>

            <div
              className={`${style.collapsibleContent} ${
                isCategoryExpanded ? style.collapsibleContentOpen : ""
              }`}
            >
              <div className={style.tagsRow}>
                {categoryTags.map((value, index) => (
                  <Tag
                    key={`cat-${index}`}
                    className={`${style.tag} ${
                      activeTagId === index ? style.tagActive : ""
                    }`}
                    style={{
                      backgroundColor:
                        activeTagId === index ? "white" : "#E6e1d8",
                    }}
                    onClick={() => setActiveTagId(index)}
                  >
                    {stringCheckAndToolTip(value?.title.trim(), 25)} (
                    {getTagCount(index)})
                  </Tag>
                ))}
              </div>
            </div>
          </div>

          {/* פילטרים נוספים - תמיד פתוח */}
          <div className={style.filterSection}>
            <div className={style.filterHeaderSimple}></div>
            <div className={style.filtersRow}>
              {/* סטטוס משימה */}
              <div className={style.filterSelectWrapper}>
                {taskStatusFilter !== "all" && (
                  <span className={style.filterBadge}>פעיל</span>
                )}
                <Select
                  value={taskStatusFilter}
                  onChange={setTaskStatusFilter}
                  className={`${style.select} ${
                    taskStatusFilter !== "all" ? style.selectActive : ""
                  }`}
                >
                  <Option value="all">סטטוס משימה ({statusCounts.all})</Option>
                  <Option value="in_progress">
                    בתהליך ({statusCounts.in_progress})
                  </Option>
                  <Option value="submitted">
                    בוצע/ממתין ({statusCounts.submitted})
                  </Option>
                  <Option value="approved">
                    אושרה ({statusCounts.approved})
                  </Option>
                </Select>
                {taskStatusFilter !== "all" && (
                  <Button
                    type="text"
                    size="small"
                    icon={<CloseCircleFilled />}
                    onClick={clearTaskStatusFilter}
                    className={style.selectClearBtn}
                  />
                )}
              </div>

              {/* סטטוס משוב */}
              <div className={style.filterSelectWrapper}>
                {statusFilter !== "all" && (
                  <span className={style.filterBadge}>פעיל</span>
                )}
                <Select
                  value={statusFilter}
                  onChange={setStatusFilter}
                  className={`${style.select} ${
                    statusFilter !== "all" ? style.selectActive : ""
                  }`}
                >
                  <Option value="all">
                    סטטוס משוב ({feedbackStatusCounts.all})
                  </Option>
                  <Option value="submitted">
                    הוגשו ({feedbackStatusCounts.submitted})
                  </Option>
                  <Option value="awaiting">
                    ממתינים ({feedbackStatusCounts.awaiting})
                  </Option>
                </Select>
                {statusFilter !== "all" && (
                  <Button
                    type="text"
                    size="small"
                    icon={<CloseCircleFilled />}
                    onClick={clearStatusFilter}
                    className={style.selectClearBtn}
                  />
                )}
              </div>

              {/* מיון */}
              <div className={style.filterSelectWrapper}>
                {sortBy !== "new" && (
                  <span className={style.filterBadge}>פעיל</span>
                )}
                <Select
                  value={sortBy}
                  onChange={setSortBy}
                  className={`${style.select} ${
                    sortBy !== "new" ? style.selectActive : ""
                  }`}
                >
                  <Option value="new">מהחדש לישן</Option>
                  <Option value="old">מהישן לחדש</Option>
                  <Option value="hight">ציון גבוה לנמוך</Option>
                  <Option value="low">ציון נמוך לגבוה</Option>
                </Select>
                {sortBy !== "new" && (
                  <Button
                    type="text"
                    size="small"
                    icon={<CloseCircleFilled />}
                    onClick={clearSortBy}
                    className={style.selectClearBtn}
                  />
                )}
              </div>

              <div className={style.dateFilterWrapper}>
                <DatePicker.RangePicker
                  value={dateRange}
                  onChange={(dates) => {
                    if (dates && dates[0] && dates[1]) {
                      setDateRange([dates[0], dates[1]]);
                    } else {
                      setDateRange([null, null]);
                    }
                  }}
                  format="DD/MM/YYYY"
                  placeholder={["מתאריך", "עד תאריך"]}
                  className={`${style.dateRangePicker} ${
                    dateRange[0] !== null ? style.dateRangePickerActive : ""
                  }`}
                  allowClear={false}
                />
                {dateRange[0] !== null && dateRange[1] !== null && (
                  <Button
                    type="text"
                    size="small"
                    icon={<CloseCircleOutlined />}
                    onClick={clearDateFilter}
                    className={style.dateFilterClearBtn}
                  />
                )}
              </div>

              {/* חיפוש */}
              <div className={style.searchWrapper}>
                <Input
                  type="search"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="חיפוש משוב או משימה..."
                  className={`${style.searchInput} ${
                    searchTerm ? style.searchInputActive : ""
                  }`}
                  suffix={
                    searchTerm ? (
                      <CloseCircleFilled
                        onClick={clearSearch}
                        style={{ cursor: "pointer" }}
                      />
                    ) : (
                      <SearchOutlined />
                    )
                  }
                />
              </div>
              {hasActiveFilters && (
                <Button
                  icon={<CloseCircleFilled />}
                  onClick={clearAllFilters}
                  className={style.clearAllBtn}
                >
                  נקה הכל
                </Button>
              )}
            </div>
          </div>
        </div>

        {!isListExpanded && (
          <div style={{ display: "flex", height: "30vh" }}>
            <FeedbackCategoryChar feedbacks={chartData} />
          </div>
        )}

        {/* רשימת המשובים */}
        <FormFiltersAndList
          feedback={filteredData}
          expanded={isListExpanded}
          onToggleExpand={() => setIsListExpanded((prev) => !prev)}
        />
      </div>

      <style>
        {`
          .ant-select-outlined:not(.ant-select-customize-input) .ant-select-selector {
            border-radius: 20px !important;
          }
        `}
      </style>
    </div>
  );
};

export default FeedbackDashboardByUser;
