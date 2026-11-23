import {
  MoreOutlined,
  CaretDownOutlined,
  CloseOutlined,
  CheckOutlined,
  PlusCircleOutlined,
} from "@ant-design/icons";
import React, { useState } from "react";
import styles from "./HeaderCard.module.css";
import { Dropdown, Input, Popconfirm, Tooltip } from "antd";
import stringCheckAndToolTip from "../../../utils/stringCheck";
import { calculateCourseLenght } from "../../../utils/CalculateTime";
import EditPermissionsModal from "../../Modals/EditPermissions/EditPermissionsModal";
import { deleteCourse, updateCourse } from "../../../services/ApiServices";
import Notification from "../../../UI/Notification/Notification";
import { useSelectionsStore } from "../../../store/selectionStore";
import { useNavigate } from "react-router-dom";
import { usePermissionStore } from "../../../store/permissionStore";
import AddCourseBatchesModal from "../../Modals/AddCourseBatches/AddCourseBatchesModal";
import { useSelectionHandler } from "../../../hooks/useSelectionHandler";
import {
  filterBatchesBySelection,
  filterCoursesBySelection,
  filterTeamsByBatch,
} from "../../../utils/filterUtils";
import { CourseBatch } from "../../../types/types";
import { useAddPermission } from "../../../hooks/useAddPermission";
import { useCourseBatchesData, useCoursesData, useTeamsData } from "../../../hooks/useHierarchyData";

interface headerProps {
  course: string;
  courseBatch: CourseBatch | null | undefined;
  startTime: Date;
  courseLenght: number;
  courseId?: string;
  onBatchSelect?: (courseId: string, batchName: string) => void;
  selectedBatch?: string;
}

const HeaderCard: React.FC<headerProps> = ({
  course,
  courseLenght,
  startTime,
  courseId,
  onBatchSelect,
  selectedBatch,
  courseBatch,
}) => {
  const courses = useCoursesData();
  const courseBatches = useCourseBatchesData();
  const { setSelectedCourseBatch, setSelectedCourse } = useSelectionsStore();
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [courseName, setCourseName] = useState<string>(course);
  const [editCourseName, setEditCourseName] = useState<boolean>(false);
  const [inputError, setInputError] = useState<boolean>(false);
  const [courseBatchModalOpen, setCourseBatchModalOpen] = useState(false);
  const { selectedPermission, setSelectedPermission, permissions } = usePermissionStore();
  const teams = useTeamsData();
  const { setSelectedDomain, setSelectedTeam, setSelectedTeamMember } =
    useSelectionsStore();
    const [showDropdown, setShowDropdown] = useState(false);
  const navigate = useNavigate();
  const { removePermissionById } = useAddPermission();

  const courseBatchesForCurrentCourse = courseBatches.filter(
    (batch) => batch.courseId === courseId
  );

  const handleActionClick = async (action: string) => {
    if (action === "editRoles") {
      setIsModalOpen(true);
    }
    if (action === "edit") {
      setEditCourseName(true);
    }
    if (action === "delete") {
      const deletingCourse = await deleteCourse(courseId);

      if (deletingCourse.status === 200) {
        const permissionsToRemove = permissions?.find(
          (p: any) => p.scope_id === courseId
        );
        if (permissionsToRemove) {
          removePermissionById(permissionsToRemove.id, false);
        }

        const newAllowedCourseIds = (selectedPermission?.allowedCourseIds || []).filter(
          (id: string | number) => id !== courseId
        );
        setSelectedPermission({
          ...selectedPermission,
          allowedCourseIds: newAllowedCourseIds,
        });

        Notification({
          type: "success",
          msg: "מחיקת הקורס בוצעה בהצלחה!",
        });
      }
    }
  };

  const handleBatchSelect = (batchName: string) => {
    if (onBatchSelect && courseId) {
      onBatchSelect(courseId, batchName);
    }
  };

  const batchMenuItems = courseBatchesForCurrentCourse.map((batch) => ({
    key: batch.name,
    label: batch.name,
    onClick: () => handleBatchSelect(batch.name),
  }));

  const { handleSelectionChange } = useSelectionHandler(
    courses,
    courseBatches,
    teams,
    setSelectedDomain,
    setSelectedCourse,
    setSelectedCourseBatch,
    setSelectedTeam,
    setSelectedTeamMember,
    setShowDropdown,
    filterCoursesBySelection,
    filterBatchesBySelection,
    filterTeamsByBatch
  );

  return (
    <div className={styles["container"]}>
      <div className={styles["dateDiv"]}>
        <div style={{ display: "flex", alignItems: "center" }}>
          {editCourseName ? (
            <div>
              <Input
                allowClear
                value={courseName}
                onChange={(e) => setCourseName(e.target.value)}
                onKeyPress={(e) => {
                  if (e.key === "Enter") {
                    const updateCourseData = {
                      name: courseName,
                    };
                    if (courseName === "") {
                      Notification({
                        type: "error",
                        msg: "נא הכנס שם חדש למחזור!",
                      });
                      setInputError(true);
                      return;
                    } else {
                      updateCourse(updateCourseData, courseId);
                      setEditCourseName(false);
                      setInputError(false);
                    }
                  }
                }}
                style={{
                  margin: "0",
                  marginTop: "20px",
                  width: "60%",
                  height: "3vh",
                  borderRadius: "20px",
                  borderColor: inputError ? "red" : "none",
                }}
              />
              <CheckOutlined
                style={{
                  fontSize: "18px",
                  marginRight: "0.5vw",
                  color: "green",
                  cursor: "pointer",
                }}
                onClick={() => {
                  const updateCourseData = {
                    name: courseName,
                  };
                  if (courseName === "") {
                    Notification({
                      type: "error",
                      msg: "נא הכנס שם חדש למחזור!",
                    });
                    setInputError(true);
                    return;
                  } else {
                    updateCourse(updateCourseData, courseId);
                    setEditCourseName(false);
                    setInputError(false);
                  }
                }}
              />
              <CloseOutlined
                style={{
                  fontSize: "18px",
                  marginRight: "0.5vw",
                  color: "red",
                  cursor: "pointer",
                }}
                onClick={() => {
                  setCourseName(course);
                  setEditCourseName(false);
                  setInputError(false);
                }}
              />
            </div>
          ) : (
            <p
              className={styles["couresTitle"]}
              style={{ margin: "0", flex: 1 }}
            >
              {stringCheckAndToolTip(course, 25)}
            </p>
          )}
        </div>
        <div className={styles["courseBatchTitle"]}>
          <p
            className={styles["courseBatchTitle"]}
            onClick={() => {
              handleSelectionChange(
                "course",
                courses.find((item) => item.id === courseId)
              );
              handleSelectionChange("courseBatches", selectedBatch);
              if (courseBatch) {
                setSelectedCourseBatch(
                  courseBatches?.find(
                    (item) =>
                      item.courseId === courseBatch.courseId &&
                      item.name === selectedBatch
                  )
                );
              } else {
                setSelectedCourseBatch(
                  courseBatches?.find((item) => item.name === selectedBatch)
                );
              }
              navigate("/dashboard/courseBatch");
            }}
          >
            {stringCheckAndToolTip(selectedBatch, 25)}
          </p>
          {selectedBatch ? (
            <Dropdown
              menu={{
                items: batchMenuItems,
                style: { textAlign: "end" },
              }}
              trigger={["click"]}
            >
              <span
                style={{
                  cursor: "pointer",
                  marginRight: "10px",
                  fontSize: "large",
                }}
              >
                <CaretDownOutlined />
              </span>
            </Dropdown>
          ) : (
            <div
              style={{
                width: "100%",
                display: "flex",
                justifyContent: "center",
              }}
              onClick={() => {
                setSelectedCourse(courses.find((c) => c.id === courseId));
                setCourseBatchModalOpen(!courseBatchModalOpen);
              }}
            >
              <span style={{ fontSize: 15 }}>אין מחזורים</span>
              <Tooltip title="הוסף מחזור">
                <PlusCircleOutlined style={{ marginRight: 10 }} />
              </Tooltip>
            </div>
          )}
        </div>
        <>
          <p className={styles["courseDate"]}>
            {startTime
              ? calculateCourseLenght(startTime, courseLenght)
              : "לא נקבע תאריך"}
          </p>
        </>
      </div>
      <Dropdown
        placement="bottom"
        menu={{
          style: { textAlign: "end" },
          items: [
            {
              key: "delete",
              label: (
                <Popconfirm
                  title="האם אתה בטוח שברצונך למחוק את קורס?"
                  description="פעולה זו לא ניתנת לביטול"
                  onConfirm={() => handleActionClick("delete")}
                  okText="כן, מחק"
                  cancelText="ביטול"
                  placement="left"
                >
                  <div style={{ color: "red" }}>מחיקה</div>
                </Popconfirm>
              ),
              style: { borderBottom: "1px solid #f0f0f0" },
            },
            {
              key: "editName",
              label: "שנה שם קורס",
              onClick: () => handleActionClick("edit"),
              style: { borderBottom: "1px solid #f0f0f0" },
            },
            {
              key: "editRoles",
              label: "עריכת הרשאות",
              onClick: () => handleActionClick("editRoles"),
              style: { borderBottom: "1px solid #f0f0f0" },
            },
          ],
        }}
        trigger={["click"]}
      >
        <MoreOutlined
          style={{
            marginTop: "15px",
            fontSize: "xx-large",
            cursor: "pointer",
            height: "4vh",
          }}
        />
      </Dropdown>
      <EditPermissionsModal
        isOpen={isModalOpen}
        setIsOpen={setIsModalOpen}
        course={course}
        courseBatch={selectedBatch}
      />
      <AddCourseBatchesModal
        isOpen={courseBatchModalOpen}
        setIsOpen={setCourseBatchModalOpen}
      />
    </div>
  );
};

export default HeaderCard;