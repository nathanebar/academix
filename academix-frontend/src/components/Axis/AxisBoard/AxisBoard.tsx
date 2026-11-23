import { useEffect, useState, useCallback, useMemo, useRef } from "react";
import AxisCard from "../AxisCard/AxisCard";
import style from "./axisBoard.module.css";
import "./axisboard.css";
import { Axis, colors, schemaMap, SchemaName } from "../../../types/types";
import { Button, Card, Input, Tooltip, message, notification } from "antd";
import {
  CloseCircleOutlined,
  PlusOutlined,
  DeleteOutlined,
  CompressOutlined,
  ExpandOutlined,
  HolderOutlined,
  CheckOutlined,
  BgColorsOutlined,
  LockOutlined,
} from "@ant-design/icons";
import BlackButton from "../../../UI/Button/BlackButton";
import {
  createAxisData,
  getTeamAxisOrder,
  updateAxisOrder,
} from "../../../services/ApiServices";
import { usePermissionStore } from "../../../store/permissionStore";
import { useSelectionsStore } from "../../../store/selectionStore";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { teamAxisOrderKeys } from "../../../api/queryKeys";
import GradeStageCard from "../../GradeStageCard/GradeStageCard";
import TagGroup from "../../TagGroup/TagGroup";
import ColorGroup from "../../ColorGroup/ColorGroup";
import {
  DndContext,
  closestCenter,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
  UniqueIdentifier,
} from "@dnd-kit/core";
import {
  SortableContext,
  useSortable,
  horizontalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

import { useBlockColorEnabled } from "../../../hooks/useTeamBlockColor";
import ExpandableMenu from "../../ExpandableMenu/ExpandableMenu";

type Props = {
  axesData?: Axis[];
  filterOption: string;
  selectedOption: number;
  filteredTaskId?: string | null;
  onClearFilter?: () => void;
  searchValue?: string; // ← NOUVEAU
  searchResults?: {
    // ← NOUVEAU
    operational: any[];
    assignment_bank: any[];
    archives: any[];
  };
};

interface AxisWithOrder extends Axis {
  _tempOrder?: number;
}

interface SortableAxisProps {
  axis: Axis;
  filterOption: string;
  isExpandedFather: boolean;
  filteredTaskId?: string | null;
  onClearFilter?: () => void;
  index: number;
  setIsDragMode: any;
  isDragMode: boolean;
  searchValue?: string; // ← NOUVEAU
  searchResults?: {
    // ← NOUVEAU
    operational: any[];
    assignment_bank: any[];
    archives: any[];
  };
}

interface OrderData {
  teamCourseBatchId: number | null;
  hasCustomOrder: boolean;
  orders: Array<{ axis_id: number; display_order: number }>;
}

function SortableAxis({
  axis,
  filterOption,
  isExpandedFather,
  filteredTaskId,
  onClearFilter,
  index,
  setIsDragMode,
  isDragMode,
  // searchValue, // ← NOUVEAU
  searchResults,
}: SortableAxisProps) {
  const axisId = axis.id ?? `axis-${index}`;

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: axisId });

  
  return (
    <div
      ref={setNodeRef}
      style={{
        transform: CSS.Transform.toString(transform),
        transition,
        opacity: isDragging ? 0.5 : 1,
      }}
      className={style["axis-wrapper"]}
      {...attributes}
    >
      {isDragMode && (
        <Tooltip title="גרור על מנת לשנות את סדר הצירים">
          <div
            className={`${style["drag-handle"]} ${
              isDragMode ? style["drag-handle-active"] : ""
            }`}
            {...listeners}
          >
            <HolderOutlined style={{ fontSize: 18 }} />
          </div>
        </Tooltip>
      )}
      <div className={style["axis-card-wrapper"]}>
        <AxisCard
          axis={axis}
          filterOption={filterOption}
          isExpandedFather={isExpandedFather}
          filteredTaskId={filteredTaskId}
          onClearFilter={onClearFilter}
        
          searchResults={searchResults} 
        />
      </div>
    </div>
  );
}

// ============================================
// 🔥 Main Component
// ============================================
const AxisBoard = ({
  axesData = [],
  filterOption,
  selectedOption,
  filteredTaskId,
  onClearFilter,
  // searchValue, // ← NOUVEAU
  searchResults, // ← NOUVEAU
}: Props) => {
  const [newAxisName, setNewAxisName] = useState("");
  const [onAddAxis, setOnAddAxis] = useState(false);
  const [isExpanded, setIsExpanded] = useState<boolean>(true);
  const [selectedColor, setSelectedColor] = useState<SchemaName>("coral");
  const [orderedAxes, setOrderedAxes] = useState<Axis[]>([]);

  const queryClient = useQueryClient();
  const { selectedPermission } = usePermissionStore();
  const {
    selectedCourse,
    selectedTeam,
    selectedCourseBatch,
    activeHeaderType,
  } = useSelectionsStore();

  const [isDragMode, setIsDragMode] = useState<boolean>(false);

  // 🔥 Sensors
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    })
  );

  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const isScrollable = (el: HTMLElement): boolean => {
      const style = window.getComputedStyle(el);
      const overflowY = style.overflowY;
      const overflowX = style.overflowX;

      return (
        ((overflowY === "auto" || overflowY === "scroll") &&
          el.scrollHeight > el.clientHeight) ||
        ((overflowX === "auto" || overflowX === "scroll") &&
          el.scrollWidth > el.clientWidth)
      );
    };

    const handleWheel = (e: WheelEvent) => {
      const target = e.target as HTMLElement;

      // 🔥 Find if there's a scrollable element between target and container
      let current: HTMLElement | null = target;

      while (current && current !== container) {
        if (isScrollable(current)) {
          // ✅ Child element is scrollable - let it handle the scroll
          return;
        }
        current = current.parentElement;
      }

      // 🔥 No scrollable child found - convert to horizontal scroll
      if (Math.abs(e.deltaY) > Math.abs(e.deltaX)) {
        e.preventDefault();
        container.scrollLeft += e.deltaY * 2;
      }
    };

    container.addEventListener("wheel", handleWheel, { passive: false });
    return () => container.removeEventListener("wheel", handleWheel);
  }, []);

  // ============================================
  // 🔥 Step 1: Filter axes
  // ============================================
  const filteredAxes = useMemo(() => {
 
    
    return axesData
      .filter((axe) => {
        switch (filterOption) {
          case "operational":
            return axe.repository_kind === "operational";
          case "assignment_bank":
            return axe.repository_kind !== "archives";
          case "archives":
            return true;
          default:
            return true;
        }
      })
      .filter((axe) => {
        if (
          activeHeaderType === "course" ||
          activeHeaderType === "courseBatches" ||
          activeHeaderType === "domain"
        ) {
          return axe.team_id === null;
        } else {
          return axe.team_id === null || axe.team_id === selectedTeam?.id;
        }
      });
  }, [axesData, filterOption, activeHeaderType, selectedTeam?.id]);

  // ============================================
  // 🔥 Step 2: Fetch order from server
  // ============================================
  // React Query (#17). Without a team / batch the query is disabled and orderData is null, as before.
  const { data: orderData = null, refetch: fetchOrder } = useQuery({
    queryKey: teamAxisOrderKeys.byTeamAndBatch(selectedTeam?.id, selectedCourseBatch?.id),
    queryFn: async (): Promise<OrderData | null> => {
      try {
        return await getTeamAxisOrder(selectedCourseBatch!.id, selectedTeam!.id);
      } catch (error) {
        console.error("Error fetching order:", error);
        return null;
      }
    },
    enabled: !!selectedTeam?.id && !!selectedCourseBatch?.id,
    staleTime: 0, // refetch on every mount, like the former useEffect
  });

  // ============================================
  // 🔥 Step 3: Apply order to filtered axes
  // ============================================
  useEffect(() => {

   
    
    if (!orderData?.hasCustomOrder || orderData.orders.length === 0) {
      setOrderedAxes(filteredAxes);
      return;
    }

    // יצירת מפה של הסדר
    const orderMap = new Map<number, number>(
      orderData.orders.map((o) => [o.axis_id, o.display_order])
    );

    // הפרדת צירים עם ובלי סדר
    const orderedAxesList: AxisWithOrder[] = [];
    const unorderedAxesList: Axis[] = [];

    filteredAxes.forEach((axis) => {
      if (axis.id != null && orderMap.has(axis.id)) {
        orderedAxesList.push({
          ...axis,
          _tempOrder: orderMap.get(axis.id),
        });
      } else {
        unorderedAxesList.push(axis);
      }
    });

    // מיון הצירים עם סדר
    orderedAxesList.sort((a, b) => {
      const aOrder = a._tempOrder ?? Infinity;
      const bOrder = b._tempOrder ?? Infinity;
      return Number(aOrder) - Number(bOrder);
    });

    // הסרת השדה הזמני וחיבור
    const result: Axis[] = [
      ...orderedAxesList.map(({ _tempOrder: _, ...axis }) => axis),
      ...unorderedAxesList,
    ];

    setOrderedAxes(result);
  }, [filteredAxes, orderData]);

  const saveOrderMutation = useMutation({
    mutationFn: async (axisIds: number[]) => {
      if (!selectedTeam?.id || !selectedCourseBatch?.id) return;
      await updateAxisOrder(selectedCourseBatch.id, selectedTeam.id, axisIds);
    },

    onSuccess: () => {
      fetchOrder();

      queryClient.invalidateQueries({ queryKey: ["AxisBatch"] });
      notification.success({
        message: "הסדר נשמר",
        duration: 2,
        placement: "topRight",
      });
    },
    onError: () => {
      notification.error({
        message: "שגיאה בשמירת הסדר – הסדר הקודם הוחזר",
        duration: 3,
        placement: "topRight",
      });
    },
  });

  const handleDragEnd = useCallback(
    (event: DragEndEvent) => {
      const { active, over } = event;

      if (over && active.id !== over.id) {
        const previousItems = orderedAxes;
        const oldIndex = previousItems.findIndex((item) => item.id === active.id);
        const newIndex = previousItems.findIndex((item) => item.id === over.id);
        if (oldIndex === -1 || newIndex === -1) return;

        const newItems = [...previousItems];
        const [removed] = newItems.splice(oldIndex, 1);
        newItems.splice(newIndex, 0, removed);

        // Optimistic (#17): show the new order now, put the previous one back if the save fails.
        // (The save used to be called inside the setState updater, which React may run twice.)
        setOrderedAxes(newItems);

        // שמירה בשרת
        const axisIds = newItems
          .map((item) => item.id)
          .filter((id): id is number => id != null);
        saveOrderMutation.mutate(axisIds, {
          onError: () => setOrderedAxes(previousItems),
        });
      }
    },
    [saveOrderMutation, orderedAxes]
  );

  const { isBlockColorEnabled, isLoading, toggleBlockColor } = useBlockColorEnabled(
    selectedTeam?.id,
    selectedCourseBatch?.id
  );
  const handleToggleBlockColor = () => {
    toggleBlockColor(!isBlockColorEnabled);
    message.success(
      isBlockColorEnabled ? "חסימת הצבע לצוות הוסרה" : "הצבע לצוות נחסם בהצלחה"
    );
  };

  const handleAddAxis = useMutation({
    mutationFn: async () => {
      if (newAxisName.trim().length === 0) {
        notification.error({
          message: "יש להקליד ציר",
          duration: 4,
          placement: "topRight",
          style: { direction: "rtl" },
        });
        return;
      }

      if (
        selectedPermission?.scope_type !== "system" &&
        !selectedPermission?.scope_id
      ) {
        console.error("Course ID is required");
        return;
      }

      const axisData: Axis = {
        name: newAxisName.trim(),
        courseId: selectedCourse.id,
        team_id: activeHeaderType !== "team" ? null : selectedTeam?.id,
        color: selectedColor as SchemaName,
        repository_kind: filterOption,
      };

      await createAxisData(axisData, selectedCourseBatch.id);

      setNewAxisName("");
      setOnAddAxis(false);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["AxisBatch"],
      });
    },
  });

  if (selectedOption === 2) {
    return (
      <div className={style["container"]}>
        <GradeStageCard
          activeHeaderType={activeHeaderType}
          filterOption={filterOption}
          isExpandedFather={isExpanded}
        />
        <ExpandButton isExpanded={isExpanded} setIsExpanded={setIsExpanded} />
      </div>
    );
  }

  if (selectedOption === 3) {
    return (
      <div className={style["container"]}>
        <TagGroup
          activeHeaderType={activeHeaderType}
          filterOption={filterOption}
          isExpandedFather={isExpanded}
        />
        <ExpandButton isExpanded={isExpanded} setIsExpanded={setIsExpanded} />
      </div>
    );
  }

  if (selectedOption === 4) {
    return (
      <div className={style["container"]}>
        <ColorGroup
          activeHeaderType={activeHeaderType}
          filterOption={filterOption}
          isExpandedFather={isExpanded}
        />
        <ExpandButton isExpanded={isExpanded} setIsExpanded={setIsExpanded} />
      </div>
    );
  }
  

  return (
    <div className={style["container"]} ref={containerRef}>
      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragEnd={handleDragEnd}
      >
        <SortableContext
          items={orderedAxes.map((a, index) => a.id ?? `axis-${index}`)}
          strategy={horizontalListSortingStrategy}
        >
          {orderedAxes.map((axis, index) => (
            <SortableAxis
              key={axis.id ?? `axis-${index}`}
              axis={axis}
              filterOption={filterOption}
              isExpandedFather={isExpanded}
              filteredTaskId={filteredTaskId}
              onClearFilter={onClearFilter}
              index={index}
              setIsDragMode={setIsDragMode}
              isDragMode={isDragMode}
              // searchValue={searchValue} // ← NOUVEAU
              searchResults={searchResults} // ← NOUVEAU
            />
          ))}
        </SortableContext>
      </DndContext>

      {activeHeaderType !== "teamMember" && filterOption === "operational" && (
        <div className={style["axis-card"]}>
          <div className={style["add-axis-content"]}>
            {onAddAxis ? (
              <div className={style["add-container"]}>
                <div className={style["color-picker-container"]}>
                  <Tooltip color="gray" title="בחר צבע">
                    <Tooltip
                      color="white"
                      arrow={false}
                      trigger="click"
                      placement="bottomRight"
                      title={
                        <div className={style["color-picker-tooltip"]}>
                          <div className={style["colors-container"]}>
                            {colors.map((color) => {
                              const gradient = schemaMap[color as SchemaName];
                              return (
                                <div
                                  key={color}
                                  className={`${style["color-option"]} ${
                                    selectedColor === color
                                      ? style["selected"]
                                      : ""
                                  }`}
                                  style={{
                                    background: `linear-gradient(135deg, ${gradient.from}, ${gradient.to})`,
                                  }}
                                  onClick={() => setSelectedColor(color)}
                                />
                              );
                            })}
                          </div>
                        </div>
                      }
                    >
                      <div
                        className={style["color-preview"]}
                        style={{
                          background: selectedColor
                            ? `linear-gradient(135deg, ${
                                schemaMap[selectedColor as SchemaName].from
                              }, ${schemaMap[selectedColor as SchemaName].to})`
                            : "linear-gradient(135deg, #E95742,#FF9E90)",
                        }}
                      />
                    </Tooltip>
                  </Tooltip>
                </div>
                <Input
                  onKeyDown={(e: any) => {
                    if (e.key === "Enter") handleAddAxis.mutate();
                  }}
                  type="search"
                  className={style["search-input"]}
                  onChange={(e) => setNewAxisName(e.target.value)}
                  value={newAxisName}
                  placeholder="הקלד כותרת לציר..."
                />
                <CloseCircleOutlined
                  onClick={() => setOnAddAxis(false)}
                  style={{ cursor: "pointer", fontSize: 20 }}
                />
              </div>
            ) : (
              <Button
                className={style["add-button"]}
                onClick={() => setOnAddAxis(true)}
              >
                הוספת ציר חדש
                <PlusOutlined />
              </Button>
            )}
          </div>
          <div className={style["add-button-container"]}>
            <BlackButton
              width={"80%"}
              height={"3vh"}
              onclickProps={handleAddAxis.mutate}
            >
              <span style={{ fontSize: 14 }}>הוספה +</span>
            </BlackButton>
          </div>
        </div>
      )}

      <Card
        id="trash-zone"
        className={style.floatingButton}
        style={{
          position: "fixed",
          width: 50,
          height: 50,
          bottom: 30,
          right: 1560,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          border: "2px dashed #aaa",
          backgroundColor: "#fafafa",
          cursor: "grab",
        }}
      >
        <DeleteOutlined />
      </Card>

      <ExpandButton isExpanded={isExpanded} setIsExpanded={setIsExpanded} />

      {selectedTeam && selectedPermission?.role_code !== "STUDENT" && (
        <ExpandableMenu
          isBlockColorEnabled={isBlockColorEnabled}
          onToggleBlockColor={handleToggleBlockColor}
          isDragMode={isDragMode}
          onToggleDragMode={() => setIsDragMode(!isDragMode)}
          isLoading={isLoading}
        />
      )}
    </div>
  );
};

function ExpandButton({
  isExpanded,
  setIsExpanded,
}: {
  isExpanded: boolean;
  setIsExpanded: (v: boolean) => void;
}) {
  return (
    <Tooltip title={isExpanded ? "לצמצם את כל הצירים" : "להרחיב את כל הצירים"}>
      <Button
        type="text"
        icon={isExpanded ? <CompressOutlined /> : <ExpandOutlined />}
        onClick={() => setIsExpanded(!isExpanded)}
        style={{
          position: "fixed",
          width: 50,
          height: 50,
          bottom: 30,
          right: 1500,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          border: "1px solid #aaa",
          backgroundColor: "#fafafa",
        }}
      />
    </Tooltip>
  );
}

export default AxisBoard;
