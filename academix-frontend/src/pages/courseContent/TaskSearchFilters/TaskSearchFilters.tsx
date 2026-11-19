// components/TaskSearchFilters/TaskSearchFilters.tsx
import React, { useState, useEffect } from "react";
import { Select, Space, Tag, Button, Tooltip } from "antd";
import { FilterOutlined, CloseOutlined } from "@ant-design/icons";
import style from "./TaskSearchFilters.module.css";
import { useFilterOptions } from "../../../hooks/useTaskSearch";
import { useSelectionsStore } from "../../../store/selectionStore";

type FilterOptions = {
  colors: string[];
  tags: { id: number; tagName: string }[];
  gradeStages: { id: number; name: string }[];
};

type TaskSearchFiltersProps = {
  filters: {
    colors: string[];
    tagIds: number[];
    gradeStageIds: number[];
  };
  onFiltersChange: (filters: {
    colors: string[];
    tagIds: number[];
    gradeStageIds: number[];
  }) => void;
};

const TaskSearchFilters: React.FC<TaskSearchFiltersProps> = ({
  filters,
  onFiltersChange,
}) => {
  const { selectedTeam, selectedCourseBatch } = useSelectionsStore();

  const courseBatchId = selectedCourseBatch?.id;
  const teamId = selectedTeam?.id;
  // const { data: options } = useFilterOptions(courseBatchId, teamId);

  const [isExpanded, setIsExpanded] = useState(false);

  const hasActiveFilters =
    filters.colors.length > 0 ||
    filters.tagIds.length > 0 ||
    filters.gradeStageIds.length > 0;

  const updateFilter = (
    key: "colors" | "tagIds" | "gradeStageIds",
    value: any[]
  ) => {
    onFiltersChange({
      ...filters,
      [key]: value,
    });
  };

  const clearAllFilters = () => {
    onFiltersChange({
      colors: [],
      tagIds: [],
      gradeStageIds: [],
    });
  };

  return (
    <div className={style["filters-container"]}>
      {/* <Tooltip title="סינון מתקדם">
        <Button
          type={hasActiveFilters ? "primary" : "default"}
          icon={<FilterOutlined />}
          onClick={() => setIsExpanded(!isExpanded)}
          className={style["filter-button"]}
        >
          סינון
          {hasActiveFilters && (
            <span className={style["filter-badge"]}>
              {filters.colors.length +
                filters.tagIds.length +
                filters.gradeStageIds.length}
            </span>
          )}
        </Button>
      </Tooltip>

      {isExpanded && (
        <div className={style["filters-panel"]}>
          <div className={style["filters-header"]}>
            <span>מסננים</span>
            {hasActiveFilters && (
              <Button
                type="link"
                size="small"
                onClick={clearAllFilters}
                icon={<CloseOutlined />}
              >
                נקה הכל
              </Button>
            )}
          </div>

          <div className={style["filter-section"]}>
            <label>צבע</label>
            <Select
              mode="multiple"
              placeholder="בחר צבעים"
              value={filters.colors}
              onChange={(values) => updateFilter("colors", values)}
              options={options?.colors.map((color: any) => ({
                value: color,
                label: (
                  <Space>
                    <span
                      style={{
                        width: 16,
                        height: 16,
                        borderRadius: 4,
                        backgroundColor: color,
                        display: "inline-block",
                      }}
                    />
                    {color}
                  </Space>
                ),
              }))}
              style={{ width: "100%" }}
              allowClear
            />
          </div>

          <div className={style["filter-section"]}>
            <label>תגיות</label>
            <Select
              mode="multiple"
              placeholder="בחר תגיות"
              value={filters.tagIds}
              onChange={(values) => updateFilter("tagIds", values)}
              options={options?.tags.map((tag: any) => ({
                value: tag.id,
                label: tag.tagName,
              }))}
              style={{ width: "100%" }}
              allowClear
            />
          </div>

          <div className={style["filter-section"]}>
            <label>שלבי הסמכה</label>
            <Select
              mode="multiple"
              placeholder="בחר שלבי הסמכה"
              value={filters.gradeStageIds}
              onChange={(values) => updateFilter("gradeStageIds", values)}
              options={options?.gradeStages.map((gs: any) => ({
                value: gs.id,
                label: gs.name,
              }))}
              style={{ width: "100%" }}
              allowClear
            />
          </div>
        </div>
      )} */}
    </div>
  );
};

export default TaskSearchFilters;
