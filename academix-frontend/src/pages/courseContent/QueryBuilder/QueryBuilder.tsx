// components/QueryBuilder/QueryBuilder.tsx
import React, { useState, useCallback, useMemo } from "react";
import { Select, Button, Tag, Tooltip } from "antd";
import {
  PlusOutlined,
  DeleteOutlined,
  SearchOutlined,
  ReloadOutlined,
} from "@ant-design/icons";
import style from "./QueryBuilder.module.css";
import {
  QueryGroup,
  Condition,
  FIELD_OPTIONS,
  OPERATOR_OPTIONS,
  QueryField,
} from "../../../types/types";
import { useSelectionsStore } from "../../../store/selectionStore";
import { useFilterOptions } from "../../../hooks/useTaskSearch";

// ==========================================
// 🔥 Helpers
// ==========================================
const generateId = () => Math.random().toString(36).substring(2, 11);

const createEmptyCondition = (): Condition => ({
  id: generateId(),
  field: "search",
  operator: "contains",
  value: "",
});

const createEmptyGroup = (logic: "AND" | "OR" = "AND"): QueryGroup => ({
  id: generateId(),
  logic,
  conditions: [createEmptyCondition()],
  groups: [],
});

// ==========================================
// 🔥 Props
// ==========================================
type QueryBuilderProps = {
  onSearch: (query: QueryGroup | null) => void;
  searchResults?: {
    operational: any[];
    assignment_bank: any[];
    archives: any[];
  } | null;
  isLoading?: boolean;
  filterOption: string;
};

const QueryBuilder: React.FC<QueryBuilderProps> = ({
  onSearch,
  searchResults,
  isLoading,
  filterOption,
}) => {
  const { selectedCourseBatch, selectedTeam } = useSelectionsStore();
  const { data: filterOptions } = useFilterOptions(
    selectedCourseBatch?.id,
    selectedTeam?.id,
    filterOption
  );

  const [rootLogic, setRootLogic] = useState<"AND" | "OR">("AND");
  const [rootItems, setRootItems] = useState<(Condition | QueryGroup)[]>([
    createEmptyCondition(),
  ]);

  const isGroup = (item: Condition | QueryGroup): item is QueryGroup => {
    return "logic" in item && "conditions" in item;
  };


  const buildQuery = useCallback((): QueryGroup => {
    const conditions: Condition[] = [];
    const groups: QueryGroup[] = [];

    rootItems.forEach((item) => {
      if (isGroup(item)) {
        groups.push(item);
      } else {
        conditions.push(item);
      }
    });

    return { id: "root", logic: rootLogic, conditions, groups };
  }, [rootItems, rootLogic]);

  const addConditionToRoot = useCallback(() => {
    setRootItems((prev) => [...prev, createEmptyCondition()]);
  }, []);

  const removeFromRoot = useCallback((index: number) => {
    setRootItems((prev) => {
      const filtered = prev.filter((_, i) => i !== index);
      return filtered.length > 0 ? filtered : [createEmptyCondition()];
    });
  }, []);

  const updateRootItem = useCallback(
    (index: number, updates: Partial<Condition>) => {
      setRootItems((prev) => {
        const newItems = [...prev];
        const item = newItems[index];
        if (!isGroup(item)) {
          newItems[index] = { ...item, ...updates };
        }
        return newItems;
      });
    },
    []
  );

  const wrapInGroup = useCallback((index: number, logic: "AND" | "OR") => {
    setRootItems((prev) => {
      const newItems = [...prev];
      const item = newItems[index];
      if (!isGroup(item)) {
        newItems[index] = createEmptyGroup(logic);
        (newItems[index] as QueryGroup).conditions = [item];
      }
      return newItems;
    });
  }, []);

  const updateGroup = useCallback(
    (groupId: string, updates: Partial<QueryGroup>) => {
      setRootItems((prev) =>
        prev.map((item) => {
          if (isGroup(item) && item.id === groupId) {
            return { ...item, ...updates };
          }
          return item;
        })
      );
    },
    []
  );

  const removeGroup = useCallback((groupId: string) => {
    setRootItems((prev) => {
      const filtered = prev.filter(
        (item) => !isGroup(item) || item.id !== groupId
      );
      return filtered.length > 0 ? filtered : [createEmptyCondition()];
    });
  }, []);

  const addConditionToGroup = useCallback((groupId: string) => {
    setRootItems((prev) =>
      prev.map((item) => {
        if (isGroup(item) && item.id === groupId) {
          return {
            ...item,
            conditions: [...item.conditions, createEmptyCondition()],
          };
        }
        return item;
      })
    );
  }, []);

  const removeConditionFromGroup = useCallback(
    (groupId: string, conditionIndex: number) => {
      setRootItems((prev) => {
        // Trouver le groupe et compter ses conditions
        const group = prev.find((item) => isGroup(item) && item.id === groupId);

        // Si c'est la dernière condition du groupe, supprimer le groupe entier
        if (group && isGroup(group) && group.conditions.length === 1) {
          return prev.filter((item) => !isGroup(item) || item.id !== groupId);
        }

        // Sinon, juste supprimer la condition
        return prev.map((item) => {
          if (isGroup(item) && item.id === groupId) {
            const newConditions = item.conditions.filter(
              (_, i) => i !== conditionIndex
            );
            return {
              ...item,
              conditions:
                newConditions.length > 0
                  ? newConditions
                  : [createEmptyCondition()],
            };
          }
          return item;
        });
      });
    },
    []
  );

  const updateConditionInGroup = useCallback(
    (groupId: string, conditionIndex: number, updates: Partial<Condition>) => {
      setRootItems((prev) =>
        prev.map((item) => {
          if (isGroup(item) && item.id === groupId) {
            return {
              ...item,
              conditions: item.conditions.map((c, i) =>
                i === conditionIndex ? { ...c, ...updates } : c
              ),
            };
          }
          return item;
        })
      );
    },
    []
  );

  const resetQuery = useCallback(() => {
    setRootLogic("AND");
    setRootItems([createEmptyCondition()]);
    onSearch(null);
  }, [onSearch]);


  const renderValueInput = (
    condition: Condition,
    itemIndex: number,
    groupId?: string,
    conditionIndex?: number
  ) => {
    const updateFn = (val: any) => {
      if (groupId && conditionIndex !== undefined) {
        updateConditionInGroup(groupId, conditionIndex, val);
      } else {
        updateRootItem(itemIndex, val);
      }
    };

    switch (condition.field) {
      case "search":
        return (
          <input
            type="text"
            placeholder="הקלד טקסט לחיפוש..."
            value={condition.value as string}
            onChange={(e) => updateFn({ value: e.target.value })}
            className={style.searchInput}
          />
        );

      case "color":
        return (
          <Select
            mode="multiple"
            placeholder="בחר צבעים"
            value={(condition.value as string[]) || []}
            onChange={(values) => updateFn({ value: values })}
            options={(filterOptions?.colors || []).map((c: string) => ({
              value: c,
              label: (
                <span style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <span
                    style={{
                      width: 16,
                      height: 16,
                      borderRadius: 4,
                      background: c,
                      display: "inline-block",
                    }}
                  />
                  {c}
                </span>
              ),
            }))}
            className={style.valueSelect}
            allowClear
          />
        );

      case "tag":
        return (
          <Select
            mode="multiple"
            placeholder="בחר תגיות"
            value={(condition.value as number[]) || []}
            onChange={(values) => updateFn({ value: values })}
            options={(filterOptions?.tags || []).map((t: any) => ({
              value: t.id, // value = ID (pour la sélection)
              label: t.tagName, // label = Nom (pour l'affichage et la recherche)
            }))}
            filterOption={(input, option) =>
              (option?.label as string)
                ?.toLowerCase()
                .includes(input.toLowerCase())
            }
            showSearch
            className={style.valueSelect}
            allowClear
            optionFilterProp="label" // Recherche sur le label, pas le value
          />
        );

      case "gradeStage":
        return (
          <Select
            mode="multiple"
            placeholder="בחר שלבי הסמכה"
            value={(condition.value as number[]) || []}
            onChange={(values) => updateFn({ value: values })}
            options={(filterOptions?.gradeStages || []).map((g: any) => ({
              value: g.id, // value = ID (pour la sélection)
              label: g.name, // label = Nom (pour l'affichage et la recherche)
            }))}
            filterOption={(input, option) =>
              (option?.label as string)
                ?.toLowerCase()
                .includes(input.toLowerCase())
            }
            showSearch
            className={style.valueSelect}
            allowClear
            optionFilterProp="label" // Recherche sur le label, pas le value
          />
        );

      default:
        return null;
    }
  };

  const renderCondition = (
    condition: Condition,
    itemIndex: number,
    groupId?: string,
    conditionIndex?: number
  ) => {
    const isRootCondition = !groupId;
    const item = isRootCondition ? rootItems[itemIndex] : null;
    const isRootItemGroup = item ? isGroup(item) : false;
    const hasMultipleRoot = rootItems.filter((i) => !isGroup(i)).length > 1;

    const showDelete = isRootCondition ? hasMultipleRoot : true;

    const updateField = (field: QueryField) => {
      if (groupId && conditionIndex !== undefined) {
        updateConditionInGroup(groupId, conditionIndex, { field, value: "" });
      } else {
        updateRootItem(itemIndex, { field, value: "" });
      }
    };

    // const updateOperator = (operator: string) => {
    //   if (groupId && conditionIndex !== undefined) {
    //     updateConditionInGroup(groupId, conditionIndex, {
    //       operator: operator as any,
    //     });
    //   } else {
    //     updateRootItem(itemIndex, { operator: operator as any });
    //   }
    // };
    return (
      <div key={condition.id} className={style.conditionRow}>
        <Select
          value={condition.field}
          onChange={(val) => updateField(val as QueryField)}
          options={Object.entries(FIELD_OPTIONS).map(([key, val]) => ({
            value: key as QueryField,
            label: val.label,
          }))}
          className={style.fieldSelect}
          size="small"
        />

        {/* <Select
          value={condition.operator}
          onChange={(val) => updateOperator(val)}
          options={OPERATOR_OPTIONS[condition.field].map((opt) => ({
            value: opt.value,
            label: opt.label,
          }))}
          className={style.operatorSelect}
          size="small"
        /> */}

        <div className={style.valueWrapper}>
          {renderValueInput(condition, itemIndex, groupId, conditionIndex)}
        </div>

        {isRootCondition && !isRootItemGroup && (
          <>
            <Tooltip title="צור קבוצה עם ו (AND)">
              <Button
                size="small"
                onClick={() => wrapInGroup(itemIndex, "AND")}
                className={style.andBtn}
              >
                וגם
              </Button>
            </Tooltip>
            <Tooltip title="צור קבוצה עם או (OR)">
              <Button
                size="small"
                onClick={() => wrapInGroup(itemIndex, "OR")}
                className={style.orBtn}
              >
                או
              </Button>
            </Tooltip>
          </>
        )}

        {showDelete && (
          <Button
            type="text"
            danger
            size="small"
            icon={<DeleteOutlined />}
            onClick={() =>
              groupId
                ? removeConditionFromGroup(groupId, conditionIndex!)
                : removeFromRoot(itemIndex)
            }
          />
        )}
      </div>
    );
  };

  const renderGroup = (group: QueryGroup, itemIndex: number) => {
    const hasMultipleGroups = rootItems.filter((i) => isGroup(i)).length > 1;

    return (
      <div
        key={group.id}
        className={style.groupContainer}
        data-logic={group.logic}
      >
        <div className={style.groupHeader}>
          <div className={style.logicToggle}>
            <button
              className={`${style.logicBtn} ${
                group.logic === "OR" ? style.active : ""
              }`}
              onClick={() => updateGroup(group.id, { logic: "OR" })}
            >
              או (OR)
            </button>
            <button
              className={`${style.logicBtn} ${
                group.logic === "AND" ? style.active : ""
              }`}
              onClick={() => updateGroup(group.id, { logic: "AND" })}
            >
              וגם (AND)
            </button>
          </div>

          <div className={style.groupHeaderRight}>
            <Tag color={group.logic === "AND" ? "blue" : "purple"}>
              {group.conditions.length} תנאים
            </Tag>
            {hasMultipleGroups && (
              <Button
                type="text"
                danger
                size="small"
                icon={<DeleteOutlined />}
                onClick={() => removeGroup(group.id)}
              />
            )}
          </div>
        </div>

        <div className={style.groupContent}>
          {group.conditions.map((condition, i) =>
            renderCondition(condition, i, group.id, i)
          )}

          <Button
            type="link"
            size="small"
            icon={<PlusOutlined />}
            onClick={() => addConditionToGroup(group.id)}
            className={style.addInGroupBtn}
          >
            הוסף תנאי בקבוצה
          </Button>
        </div>
      </div>
    );
  };

  const totalResults = useMemo(() => {
    if (!searchResults) return 0;
    return (
      (searchResults.operational?.length || 0) +
      (searchResults.assignment_bank?.length || 0) +
      (searchResults.archives?.length || 0)
    );
  }, [searchResults]);

  return (
    <div>
      <div className={style.rootContainer} data-logic={rootLogic}>
        <div className={style.rootHeader}>
          <div className={style.logicToggle}>
            <button
              className={`${style.logicBtn} ${
                rootLogic === "OR" ? style.active : ""
              }`}
              onClick={() => setRootLogic("OR")}
            >
              או (OR)
            </button>
            <button
              className={`${style.logicBtn} ${
                rootLogic === "AND" ? style.active : ""
              }`}
              onClick={() => setRootLogic("AND")}
            >
              וגם (AND)
            </button>
          </div>
          <Tag color={rootLogic === "AND" ? "blue" : "purple"}>
            {rootItems.length} פריטים
          </Tag>
        </div>

        <div className={style.rootContent}>
          {rootItems.map((item, index) => {
            if (isGroup(item)) {
              return renderGroup(item, index);
            }
            return (
              <div key={item.id} className={style.conditionWrapper}>
                {renderCondition(item, index)}
              </div>
            );
          })}

          <Button
            type="dashed"
            icon={<PlusOutlined />}
            onClick={addConditionToRoot}
            className={style.addBtn}
          >
            הוסף תנאי
          </Button>
        </div>
      </div>
      <div className={style.headerActions}>
        {totalResults > 0 && (
          <span className={style.badge}>{totalResults} תוצאות</span>
        )}
        <Button icon={<ReloadOutlined />} size="small" onClick={resetQuery}>
          איפוס
        </Button>
        <Button
          type="primary"
          icon={<SearchOutlined />}
          onClick={() => onSearch(buildQuery())}
          loading={isLoading}
        >
          חפש
        </Button>
      </div>
    </div>
  );
};

export default QueryBuilder;
