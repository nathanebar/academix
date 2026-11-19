import { Input, Select, DatePicker, Tabs, Button, Badge } from "antd";
import { SearchOutlined, ClearOutlined } from "@ant-design/icons";
import { Dayjs } from "dayjs";

const { RangePicker } = DatePicker;

interface FeedbackFiltersProps {
  timeFilter: string;
  setTimeFilter: (value: string) => void;
  statusFilter: string;
  setStatusFilter: (value: string) => void;
  searchTerm: string;
  setSearchTerm: (value: string) => void;
  dateSort: string;
  setDateSort: (value: string) => void;
  dateRange: [Dayjs | null, Dayjs | null] | null;
  setDateRange: (dates: [Dayjs | null, Dayjs | null] | null) => void;
}
const DEFAULT_TIME_FILTER = "1"; // "השבוע" היא ברירת המחדל

const FeedbackFilters = ({
  timeFilter,
  setTimeFilter,
  statusFilter,
  setStatusFilter,
  searchTerm,
  setSearchTerm,
  dateSort,
  setDateSort,
  dateRange,
  setDateRange,
}: FeedbackFiltersProps) => {
  const showDatePicker = dateSort === "date-picker";

  const activeCount =
    (timeFilter !== DEFAULT_TIME_FILTER && timeFilter !== "4" ? 1 : 0) +
    (statusFilter !== "all" ? 1 : 0) +
    (searchTerm.trim() !== "" ? 1 : 0) +
    (dateSort === "new-to-old" || dateSort === "old-to-new" ? 1 : 0) +
    (dateSort === "date-picker" && dateRange?.[0] && dateRange?.[1] ? 1 : 0);

  const hasActiveFilters = activeCount > 0;

  const handleClearFilters = () => {
    setTimeFilter(DEFAULT_TIME_FILTER);
    setStatusFilter("all");
    setSearchTerm("");
    setDateSort("all");
    setDateRange(null);
  };

  const handleDateSortChange = (value: string) => {
    setDateSort(value);
    if (value !== "date-picker") {
      setDateRange(null);
    }
  };
  

  const handleRangeSelect = (dates: [Dayjs | null, Dayjs | null] | null) => {
    if (dates && dates[0] && dates[1]) {
      if (dates[0].isSame(dates[1], "day")) {
        setDateRange([dates[0], dates[0]]);
      } else {
        setDateRange(dates);
      }
    } else {
      setDateRange(dates);
    }
  };

  const SORT_LABELS: Record<string, string> = {
    all: "הכל",
    "new-to-old": "מהחדש לישן",
    "old-to-new": "מהישן לחדש",
    "date-picker": "לפי טווח תאריכים",
  };

  const getDateSortLabel = () => {
    if (dateSort === "date-picker" && dateRange?.[0] && dateRange?.[1]) {
      const startLabel = dateRange[0].format("DD/MM/YYYY");
      const endLabel = dateRange[1].format("DD/MM/YYYY");
      return startLabel === endLabel
        ? startLabel
        : `${startLabel} - ${endLabel}`;
    }

    return SORT_LABELS[dateSort] || "בחר...";
  };

  return (
    <div
      style={{
        marginBottom: 16,
        alignItems: "center",
        position: "sticky",
        top: 116,
        zIndex: 10,
        background: "#f8f6f2",
      }}
    >
      <Tabs activeKey={timeFilter} onChange={setTimeFilter} size="small">
        <Tabs.TabPane key="0" tab={<span>היום</span>} />
        <Tabs.TabPane key="1" tab={<span>השבוע</span>} />
        <Tabs.TabPane key="2" tab={<span>עתידיות</span>} />
        <Tabs.TabPane key="4" tab={<span>הכל</span>} />
      </Tabs>

      <div
        style={{
          display: "flex",
          gap: 8,
          flexWrap: "wrap",
          alignItems: "center",
        }}
      >
        <Select
          value={statusFilter === "all" ? "לפלטר לפי משובים" : statusFilter}
          onChange={setStatusFilter}
          style={{ width: 180 }}
          placeholder="בחר סטטוס"
        >
          <Select.Option value="all">הכל</Select.Option>
          <Select.Option value="submitted">משובים שהוגשו</Select.Option>
          <Select.Option value="awaiting">משובים שממתינים לתגובה</Select.Option>
          <Select.Option value="no-response">ללא תגובה</Select.Option>
        </Select>

        <Select
          value={getDateSortLabel()}
          onChange={handleDateSortChange}
          style={{ width: 150 }}
          placeholder="סדר תאריכים"
        >
          <Select.Option value="all">הכל</Select.Option>
          <Select.Option value="new-to-old">מהחדש לישן</Select.Option>
          <Select.Option value="old-to-new">מהישן לחדש</Select.Option>
          <Select.Option value="date-picker">לפי טווח תאריכים</Select.Option>
        </Select>

        {showDatePicker && (
          <RangePicker
            value={dateRange}
            onChange={handleRangeSelect}
            format="DD/MM/YYYY"
            placeholder={["מתאריך", "עד תאריך"]}
            style={{ width: 220, direction: "rtl" }}
            allowClear={true}
            separator="עד"
          />
        )}

        <Input
          prefix={<SearchOutlined />}
          placeholder="חפש לפי משוב או תרגיל"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          style={{ width: 200 }}
        />

        {/* כפתור ניקוי פילטרים + חיווי על פילטרים פעילים */}
        <Badge count={activeCount} color="#ff4d4f" offset={[-8, 4]}>
          <Button
            size="small"
            onClick={handleClearFilters}
            disabled={!hasActiveFilters}
            danger={hasActiveFilters}
          >
            נקה פילטורים
          </Button>
        </Badge>
      </div>
    </div>
  );
};

export default FeedbackFilters;
