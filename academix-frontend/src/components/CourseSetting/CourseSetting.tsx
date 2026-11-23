import style from "./CourseSetting.module.css";
import { useSelectionsStore } from "../../store/selectionStore";
import { ReactComponent as EditIcon } from "../../media/icons/Edit Icon.svg";
import { useState } from "react";
import { updateCourse } from "../../services/ApiServices";
import Notification from "../../UI/Notification/Notification";
import { Input } from "antd";
import { CheckOutlined, CloseOutlined } from "@ant-design/icons";
import EditPermissionsModal from "../Modals/EditPermissions/EditPermissionsModal";
import { useUserStore } from "../../store/userStore";
import { usePermissionStore } from "../../store/permissionStore";
import { useFetchCourseCommanders } from "../../hooks/useFetchCourseCommanders";
import { useEffect } from "react";
import { updateCoursesData } from "../../hooks/useHierarchyData";

const CourseSetting = () => {
  const { selectedCourse, setSelectedCourse } = useSelectionsStore();
  const { selectedPermission } = usePermissionStore();

  const course = selectedCourse;
  //for search commander
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [showOptions, setShowOptions] = useState(false);
  const [editLocation, setEditLocation] = useState<boolean>(false);
  const [locationValue, setLocationValue] = useState<string>(course?.location);
  const [selectedDuration, setSelectedDuration] = useState(
    course?.duration_months
  );

  useEffect(() => {
    if (!showOptions) {
      setSelectedDuration(selectedCourse?.duration_months);
    }
    if (!editLocation) {
      setLocationValue(selectedCourse?.location || "");
    }
    setEditLocation(false);
    setShowOptions(false);
  }, [selectedCourse]);

  const hasAnyInfo =
    course?.requirements || course?.targets || course?.description;

  const durationOptions = Array.from({ length: 24 }, (_, i) => i + 1);

  const { data: selectedCourseCommanders } = useFetchCourseCommanders(selectedCourse?.id);

  const handleEditClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    setShowOptions(!showOptions);
  };

  const handleOptionSelect = async (duration: number) => {
    setSelectedDuration(duration);
    setShowOptions(false);

    const data = {
      ...selectedCourse,
      duration_months: duration,
    };

    const updatingCourse = await updateCourse(data, course.id);
    if (updatingCourse.status === 200) {
      setSelectedCourse(updatingCourse.data);
      setSelectedDuration(updatingCourse.data.duration_months);
      // cache of the courses query (was the courses store, #17)
      updateCoursesData((courses) =>
        courses.map((c: any) => (c.id === selectedCourse.id ? updatingCourse.data : c))
      );
      Notification({ type: "success", msg: "משך הקורס עודכן בהצלחה!" });
    } else {
      Notification({ type: "error", msg: "חלה שגיאה בעדכון הקורס!" });
    }
  };

  const handleCourseLocation = async () => {
    const data = {
      ...selectedCourse,
      location: locationValue,
    };

    const updatingCourse = await updateCourse(data, selectedCourse.id);
    if (updatingCourse.status === 200) {
      setSelectedCourse(updatingCourse.data);
      setLocationValue(updatingCourse.data.location || "");
      setEditLocation(false);
      Notification({ type: "success", msg: "מיקום הקורס עודכן בהצלחה!" });
    } else {
      Notification({ type: "error", msg: "חלה שגיאה בעדכון הקורס!" });
    }
  };

  return (
    <div className={style.card}>
      <h3 className={style.title}>הגדרות קורס</h3>
      <div style={{ overflowY: "auto", height: "35vh", padding: "10px" }}>
        <p style={{ margin: "0" }} className={style.sub_title}>
          מפקד הקורס
        </p>
        <div style={{ minHeight: "" }} className={style.filed}>
          <span
            style={{
              minHeight: "auto",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
            }}
          >
            {selectedCourseCommanders?.length > 0
              ? selectedCourseCommanders
                ?.map((p: any) => p.User?.name)
                .join(", ")
              : 'אין מק"ס'}{" "}
            <EditIcon
              onClick={() => {
                selectedPermission?.role_code === "SYSTEM-ADMIN" ||
                  selectedPermission?.role_code === "DOMAIN_MANAGER"
                  ? setIsModalOpen(true)
                  : null;
              }}
              style={{
                fontSize: "0.2vh",
                height: "1.5vh",
                cursor: "pointer",
              }}
            />
          </span>
        </div>

        <p style={{ paddingTop: "10px" }} className={style.sub_title}>
          משך הקורס
        </p>
        <div
          style={{
            minHeight: "auto",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
          className={style.filed}
        >
          {selectedDuration} חודשים
          <div style={{ position: "relative" }}>
            <EditIcon
              onClick={
                selectedPermission?.role_code === "SYSTEM-ADMIN" ||
                  selectedPermission?.role_code === "DOMAIN_MANAGER"
                  ? handleEditClick
                  : undefined // ← not null
              }
              style={{
                fontSize: "0.2vh",
                height: "1.5vh",
                cursor: "pointer",
              }}
            />

            {showOptions && (
              <div
                style={{
                  position: "absolute",
                  left: 10,
                  backgroundColor: "white",
                  border: "1px solid #ccc",
                  borderRadius: "4px",
                  boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
                  width: "120px",
                  height: "18vh",
                  overflowY: "auto",
                }}
              >
                {durationOptions.map((option) => (
                  <div
                    key={option}
                    onClick={() => handleOptionSelect(option)}
                    style={{
                      padding: "8px 12px",
                      cursor: "pointer",
                      borderBottom:
                        option !== durationOptions[durationOptions.length - 1]
                          ? "1px solid #eee"
                          : "none",
                    }}
                    onMouseDown={(e) => e.preventDefault()}
                  >
                    {option} חודשים
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <p className={style.sub_title} style={{ paddingTop: "10px" }}>
          מיקום הקורס
        </p>
        <div className={style.filed}>
          {!editLocation ? (
            <span
              style={{
                minHeight: "auto",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
              }}
            >
              {course?.location ? course.location : "-לא נקבע מיקום-"}
              <EditIcon
                onClick={() => {
                  selectedPermission?.role_code === "SYSTEM-ADMIN" ||
                    selectedPermission?.role_code === "DOMAIN_MANAGER"
                    ? setEditLocation(true)
                    : null; // ← not null
                }}
                style={{
                  fontSize: "0.2vh",
                  height: "1.5vh",
                  cursor: "pointer",
                }}
              />
            </span>
          ) : (
            <div style={{ display: "flex", alignItems: "center" }}>
              <Input
                allowClear
                value={locationValue}
                placeholder={course?.location || "-לא נקבע מיקום-"}
                style={{ width: "100%" }}
                onChange={(e) => {
                  setLocationValue(e.target.value);
                }}
              />
              <div className={style.buttonsDiv}>
                <CheckOutlined
                  onClick={handleCourseLocation}
                  className={style.buttons}
                  style={{
                    backgroundColor: "lightGreen",
                  }}
                />
                <CloseOutlined
                  onClick={() => setEditLocation(false)}
                  className={style.buttons}
                  style={{
                    backgroundColor: "red",
                  }}
                />
              </div>
            </div>
          )}
        </div>

        {hasAnyInfo && (
          <div
            style={{
              minHeight: "8.8vh",
              maxHeight: "9vh",
              padding: "20px 10px",
            }}
            className={style.filed}
          >
            {course?.description && (
              <p
                style={{
                  margin: "0",
                  // paddingRight: "15px",
                  wordWrap: "break-word",
                  overflowWrap: "break-word",
                  width: "33vw",
                }}
              >
                <strong> תיאור: </strong>
                {course.description}
              </p>
            )}
          </div>
        )}
      </div>
      <EditPermissionsModal
        isOpen={isModalOpen}
        setIsOpen={setIsModalOpen}
        course={course?.name}
      />
      <style>
        {`
        :where(.css-dev-only-do-not-override-l9pxc0).ant-input-search >.ant-input-group >.ant-input-group-addon:last-child .ant-input-search-button {
          margin-inline-end: -1px;
          border-start-start-radius: 0;
          border-end-start-radius: 0;
          border-right: none;`}
      </style>
    </div>
  );
};

export default CourseSetting;
