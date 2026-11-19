import { useEffect, useState } from "react";
import { useSelectionsStore } from "../../../store/selectionStore";
import RegularInput from "../../../UI/Input/Input/RegularInput";
import GenericModal from "../GenericModal";
import { ReactComponent as EditIcon } from "../../../media/icons/Edit Icon.svg";
import { ReactComponent as CalaenderIcon } from "../../../media/icons/Group 2.svg";
import { CloseCircleOutlined, CloseOutlined } from "@ant-design/icons";
import { ConfigProvider, DatePicker } from "antd";
import dayjs, { Dayjs } from "dayjs";
import BlackButton from "../../../UI/Button/BlackButton";
import he_IL from "antd/locale/he_IL";
import Notification from "../../../UI/Notification/Notification";
import {
  createCourseBatch,
  updateCourseBatch,
} from "../../../services/ApiServices";
import { usePermissionStore } from "../../../store/permissionStore";
import utc from "dayjs/plugin/utc";
dayjs.extend(utc);
type AddCourseBatchesModalProps = {
  isOpen: boolean;
  setIsOpen: (open: boolean) => void;
  cbName?: string;
  date?: Dayjs | any;
  cbID?: string | number;
};

const AddCourseBatchesModal: React.FC<AddCourseBatchesModalProps> = ({
  isOpen,
  setIsOpen,
  cbName,
  date,
  cbID,
}) => {
  const { selectedCourse } = useSelectionsStore();
  const [courseBatchName, setCourseBatchName] = useState<string>(
    cbName ? cbName : ""
  );
  const [datePickerValue, setDatePickerValue] = useState<Dayjs | any>("");
  const [datePickerOpen, setDatePickerOpen] = useState<boolean>(false);
  const [inputError, setInputError] = useState<boolean>(false);

  const { selectedPermission, setSelectedPermission } = usePermissionStore();

  const formatDate = (isoString: string) => {
    if (!isoString) return "";

    const date = new Date(isoString);
    const day = String(date.getDate()).padStart(2, "0");
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const year = date.getFullYear();

    return `${day}/${month}/${year}`;
  };

  useEffect(() => {
    setDatePickerValue(formatDate(date));
  }, [date]);

  useEffect(() => {
    if (!isOpen) {
      setInputError(false);
      if (!date) {
        setDatePickerValue("");
      }
    }
  }, [isOpen]);

  const isValidDate = (date: string) => {
    const [day, month, year] = date.split("/").map(Number);

    const inputDate = new Date(year, month - 1, day);

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    return inputDate > today;
  };

  const updateCB = async (cbID: string | number | undefined) => {
    if (!courseBatchName && !datePickerValue) {
      Notification({ type: "error", msg: "נא מלא פרטים!" });
      setInputError(true);
      return;
    }
    if (!courseBatchName) {
      Notification({ type: "error", msg: "נא מלא שם קורס !" });
      setInputError(true);
      return;
    }
    if (!datePickerValue) {
      Notification({ type: "error", msg: "נא מלא תאריך התחלה לקורס !" });
      setInputError(true);
      return;
    }

    if (!isValidDate(datePickerValue)) {
      Notification({ type: "error", msg: "נא מלא תאריך תקין!" });
      return;
    }
    try {
      let formattedDate: any;

      // בדיקה מה אתה מקבל מה-DatePicker
      if (typeof datePickerValue === "string") {
        const [day, month, year] = datePickerValue.split("/");

        formattedDate = new Date(`${year}-${month}-${day}`);
      } else if (datePickerValue instanceof Date) {
        formattedDate = datePickerValue;
      } else {
        throw new Error("Invalid date format");
      }

      if (isNaN(formattedDate.getTime())) {
        throw new Error("Invalid date");
      }

      const courseBatchData = {
        name: courseBatchName,
        start_date: formattedDate,
        status: "draft",
      };
      const updatingCourseBatch = await updateCourseBatch(
        courseBatchData,
        cbID
      );

      if (updatingCourseBatch?.status === 409) {
        Notification({ type: "error", msg: "שם מחזור זה כבר קיים!" });
      }

      if (updatingCourseBatch?.status === 200) {
        Notification({ type: "success", msg: "המחזור עודכן בהצלחה!" });
        setIsOpen(false);
        setInputError(false);
        setCourseBatchName("");
        setDatePickerValue(undefined);

        const newAllowedCourseBatcheIdsIds = [
          ...selectedPermission?.allowedCourseBatcheIds ?? [],
          updatingCourseBatch?.data?.id,
        ];

        setSelectedPermission({
          ...selectedPermission,
          allowedCourseBatcheIds: newAllowedCourseBatcheIdsIds,
        });
      }
    } catch (error) {
      console.log(error);
      Notification({
        type: "error",
        msg: "שגיאה בעדכון המחזור. אנא נסה שוב.",
      });
    }
  };

  const addCB = async () => {
    if (!courseBatchName.trim() && !datePickerValue) {
      Notification({ type: "error", msg: "נא מלא פרטים!" });
      setInputError(true);
      return;
    }
    if (!courseBatchName.trim()) {
      Notification({ type: "error", msg: "נא מלא שם קורס !" });
      setInputError(true);
      return;
    }
    if (!datePickerValue) {
      Notification({ type: "error", msg: "נא מלא תאריך התחלה לקורס !" });
      setInputError(true);
      return;
    }

    if (!isValidDate(datePickerValue)) {
      Notification({ type: "error", msg: "נא מלא תאריך תקין!" });
      setInputError(true);
      return;
    }
    try {
      let formattedDate: any;

      // בדיקה מה אתה מקבל מה-DatePicker
      if (typeof datePickerValue === "string") {
        const [day, month, year] = datePickerValue.split("/");

        formattedDate = new Date(`${year}-${month}-${day}`);
      } else if (datePickerValue instanceof Date) {
        formattedDate = datePickerValue;
      } else {
        throw new Error("Invalid date format");
      }

      if (isNaN(formattedDate.getTime())) {
        Notification({ type: "error", msg: "נא מלא תאריך תקין!" });
        setInputError(true);
        return;
      }

      const courseBatchData = {
        courseId: selectedCourse?.id,
        name: courseBatchName,
        start_date: formattedDate,
        status: "draft",
      };
      const creatingCorseBatch = await createCourseBatch(courseBatchData);

      if (creatingCorseBatch?.status === 409) {
        Notification({ type: "error", msg: "שם מחזור זה כבר קיים!" });
      }

      if (creatingCorseBatch?.status === 201) {
        Notification({ type: "success", msg: "המחזור נוצר בהצלחה!" });
        setIsOpen(false);
        setInputError(false);
        setCourseBatchName("");
        setDatePickerValue(undefined);

        
        
        const newAllowedCourseBatcheIdsIds = [
          ...selectedPermission?.allowedCourseBatcheIds ?? [],
          creatingCorseBatch?.data?.batch?.id,
        ];

        setSelectedPermission({
          ...selectedPermission,
          allowedCourseBatcheIds: newAllowedCourseBatcheIdsIds,
        });
      }
    } catch (error) {
      console.log(error);
      Notification({
        type: "error",
        msg: "שגיאה ביצירת המחזור. אנא נסה שוב.",
      });
    }
  };

  return (
    <ConfigProvider
      locale={he_IL}
      theme={{
        components: {
          DatePicker: {
            cellWidth: 50,
          },
          Input: {
            colorTextPlaceholder: "rgba(94,99,102,1)",
          },
        },
      }}
    >
      <GenericModal
        isOpen={isOpen}
        setIsOpen={setIsOpen}
        title={`קורס ${selectedCourse?.name}`}
        width="36vw"
        height="38.5vh"
      >
        <div>
          <RegularInput
            hasError={!courseBatchName.trim() && inputError ? true : false}
            borderColor={
              !courseBatchName.trim() && inputError ? "red" : "white"
            }
            height="5.2vh"
            placeholder={cbName ? cbName : "שם המחזור"}
            value={courseBatchName}
            setValue={setCourseBatchName}
            suffix={
              courseBatchName ? (
                <CloseCircleOutlined
                  onClick={() => setCourseBatchName("")}
                  style={{ fontSize: "2vh", height: "1.5vh" }}
                />
              ) : (
                <EditIcon style={{ fontSize: "0.2vh", height: "1.5vh" }} />
              )
            }
          />
          <h4 style={{ fontWeight: 500 }}>תאריך התחלה</h4>
          <div
            style={{
              display: "flex",
              width: "16vw",
              justifyContent: "space-between",
            }}
          >
            <div style={{ display: "inline-block", position: "relative" }}>
              <CalaenderIcon
                onClick={() => setDatePickerOpen((prev) => !prev)}
                style={{ height: "5.2vh", width: "2.3vw", cursor: "pointer" }}
              />

              <DatePicker
                open={datePickerOpen}
                value={
                  datePickerValue
                    ? dayjs(datePickerValue, "DD/MM/YYYY")
                    : dayjs()
                }
                onChange={(date: Dayjs) => {
                  setDatePickerValue(date?.format("DD/MM/YYYY"));
                  setDatePickerOpen(false);
                }}
                onOpenChange={(status) => setDatePickerOpen(status)}
                picker="date"
                disabledDate={(current) => {
                  return current && current < dayjs().startOf("day");
                }}
                style={{
                  cursor: "pointer",
                  width: "22vw",
                  height: "4vh",
                  opacity: 0,
                  position: "absolute",
                  top: 0,
                  left: 0,
                }}
              />
            </div>

            <RegularInput
              hasError={!datePickerValue && inputError ? true : false}
              borderColor={(!datePickerValue || !isValidDate(datePickerValue)) && inputError ? "red" : "white"}
              placeholder="dd/mm/yyyy"
              width="13vw"
              value={datePickerValue}
              setValue={setDatePickerValue}
              suffix={
                datePickerValue ? (
                  <CloseOutlined
                    onClick={() => setDatePickerValue(undefined)}
                  />
                ) : undefined
              }
            />
          </div>
        </div>

        <div style={{ marginTop: "5vh" }}>
          <BlackButton
            width="8.8vw"
            height="4.4vh"
            onclickProps={cbName && date ? () => updateCB(cbID) : () => addCB()}
          >
            {cbName && date ? " שמור שינויים" : "יצירת מחזור חדש +"}
          </BlackButton>
        </div>
      </GenericModal>
    </ConfigProvider>
  );
};

export default AddCourseBatchesModal;
