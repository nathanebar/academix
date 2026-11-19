import React, { useEffect, useState } from "react";
import GenericModal from "../GenericModal";
import style from "./AddCourseModal.module.css";
import {
  AutoComplete,
  Button,
  ConfigProvider,
  Input,
  notification,
  Select,
} from "antd";
import { ReactComponent as EditIcon } from "../../../media/icons/Edit Icon.svg";
import he_IL from "antd/locale/he_IL";
import RegularInput from "../../../UI/Input/Input/RegularInput";
import { CloseCircleOutlined } from "@ant-design/icons";
import {
  createCourse,
  createRoleAssigment,
  createUser,
} from "../../../services/ApiServices";
import Notification from "../../../UI/Notification/Notification";
import { useSelectionsStore } from "../../../store/selectionStore";
import { usePermissionStore } from "../../../store/permissionStore";
import { OnSearch } from "../../../utils/OnSearch";
import { Assignment } from "../../../types/types";
import { useUserStore } from "../../../store/userStore";
import { queryClient } from "../../../api/queryClient";

type AddCourseModalProps = {
  isOpen: boolean;
  setIsOpen: (open: boolean) => void;
};

const AddCourseModal: React.FC<AddCourseModalProps> = ({
  isOpen,
  setIsOpen,
}) => {
  const [courseValue, setCourseValue] = useState<string>("");
  const [courseDorationValue, setCourseDorationValue] = useState<
    string | undefined
  >();
  const [courseCommander, setCourseCommander] = useState<any>({});
  const [resultsObj, setResultsObj] = useState<any>([]);
  const [results, setResults] = useState<any>([]);
  const [searchInputValue, setSearchInputValue] = useState<string>("");
  const [courseSymbolValue, setCourseSymbolValue] = useState<string>("");
  const [courseDescripition, setCourseDescripition] = useState<string>("");
  const [courseLocation, setCourseLocation] = useState<string>("");
  const [inputError, setInputError] = useState<boolean>(false);
  const { selectedDomain } = useSelectionsStore();
  const { selectedPermission, setSelectedPermission, addPermission } =
    usePermissionStore();

  

  useEffect(() => {
    if (!isOpen) {
      setInputError(false);
    }
  }, [isOpen]);

  const addCourse = async () => {
    if (
      !courseValue &&
      (!courseDorationValue || courseDorationValue === undefined)
    ) {
      Notification({ type: "error", msg: "נא מלא פרטים!" });
      setInputError(true);
      return;
    }
    if (!courseValue) {
      Notification({ type: "error", msg: "נא הכנס שם קורס!" });
      setInputError(true);
      return;
    }
    if (!courseDorationValue) {
      Notification({ type: "error", msg: "נא הכנס אורך קורס משוער!" });
      setInputError(true);
      return;
    }
    /*  if (Object.keys(courseCommander).length <= 0) {
      Notification({ type: "error", msg: "נא הכנס מפקד קורס!" });
      setInputError(true);
      return;
    } */

    const courseData = {
      domainId: selectedDomain?.id,
      name: courseValue,

      duration_months: courseDorationValue,
      description: courseDescripition ? courseDescripition : null,
      location: courseLocation ? courseLocation : null,
    };

    // await createUser(courseCommander);
    const creatingCourse = await createCourse(courseData);

    /*     const roleAssigmentData = {
      username: courseCommander.username,
      role_code: "COURSE_COMMANDER",
      scope_type: "course",
      scope_id: creatingCourse.data.id,
      course_id: creatingCourse.data.id,
    };

    const creatingRoleAssiment = await createRoleAssigment(roleAssigmentData); */

    if (creatingCourse?.status === 409) {
      Notification({ type: "error", msg: "קורס זה כבר קיים!" });
    }
    if (creatingCourse?.status == 201) {
      /* 
      const newPermission: Assignment = {
        id: creatingRoleAssiment.data.id,
        user_id: courseCommander.id || 0,
        role_code: "COURSE_COMMANDER",
        scope_type: "course",
        scope_id: creatingCourse.data.id,
        scopeName: courseValue,
        role_name: "מפקד קורס",
        allowedTeamIds: [],
        allowedCourseIds: [creatingCourse.data.id],
        allowedCourseBatcheIds: [],
        allowedAxisIds: [],
        allowedDomainIds: selectedDomain?.id ? [selectedDomain.id] : [],
      };
      
         queryClient.invalidateQueries({
                queryKey: ["permissions"],
              });
      setSelectedPermission(newPermission);

      
      } */
      const newAllowedCourseIds = [
        ...(selectedPermission?.allowedCourseIds ?? []),
        creatingCourse.data.id,
      ];
      setSelectedPermission({
        ...selectedPermission,
        allowedCourseIds: newAllowedCourseIds,
      });

      notification.success({
        message: "מזל טוב!",
        description: "הקורס נוצר בהצלחה!",
        duration: 4,
        placement: "top",
        style: { direction: "rtl" },
      });

      setIsOpen(false);
      setInputError(false);
      setCourseDorationValue(undefined);
      setSearchInputValue("");
      setCourseValue("");
      setCourseSymbolValue("");
      setCourseDescripition("");
      setCourseLocation("");
    }
  };

  const courseLengthOptions = Array.from({ length: 24 }, (_, i) => i + 1);
  const options = courseLengthOptions.map((num) => ({
    value: num,
    label: num + " חודשים",
  }));

  const GetUserFromArr = async (input: string) => {
    let username: string;
    const hyphenIndex = input.indexOf("-");
    if (hyphenIndex === -1) {
      username = input;
    } else {
      username = input.substring(0, hyphenIndex);
    }
    try {
      const user = resultsObj?.find(
        (r: any) => r?.username === username.trim()
      );
      const userData = {
        name: user.fullName,
        username: user.username,
        militaryid: user.personalNumber,
        password: "12345",
      };
      setCourseCommander(userData);
      setResults([]);
    } catch (error) {
      console.log(error);
    }
  };

  const HandleOnSearch = async (value: string) => {
    await OnSearch(value, searchInputValue, setResults, setResultsObj);
  };

  return (
    <ConfigProvider
      locale={he_IL}
      theme={{
        components: {
          Input: {
            hoverBg: "none",
            activeBg: "none",
            colorBgContainer:
              !courseDorationValue && inputError
                ? "rgba(255,241,240,1)"
                : "rgba(244, 241, 235, 1)",
            colorTextPlaceholder: "rgba(94,99,102,1)",
            borderRadius: 20,
          },
          Button: {
            defaultHoverBg: "none",
            colorPrimaryHover: "#3d3e8d",
          },
          Select: {
            borderRadius: 40,
            colorBorder: !courseDorationValue && inputError ? "red" : "white",
            colorBgContainer:
              !courseDorationValue && inputError
                ? "rgba(255,241,240,1)"
                : "rgba(244, 241, 235, 1)",
            hoverBorderColor: "white",
            activeBorderColor: "none",
            colorTextPlaceholder: "rgba(94,99,102,1)",
          },
        },
      }}
    >
      <GenericModal
        isOpen={isOpen}
        setIsOpen={setIsOpen}
        width="35vw"
        title={selectedDomain?.name}
      >
        <div className={style.mainContainer}>
          {/*     <div className={style.options}>
            <span className={style.title}>מפקד הקורס</span>
            <AutoComplete
              options={results}
              onSelect={(value) => {
                setSearchInputValue(value);
                GetUserFromArr(value);
              }}
              value={searchInputValue}
            >
              <Input.Search
                placeholder="מפקד הקורס"
                allowClear
                onChange={(e) => {
                  setResults([]);
                  setSearchInputValue(e.target.value);
                }}
                onSearch={HandleOnSearch}
                onKeyDown={(e: any) => {
                  if (e.ctrlKey && (e.key === "k" || e.key === "ל")) {
                    e.preventDefault();
                    HandleOnSearch(e?.target?.value);
                  }
                }}
              />
            </AutoComplete>
          </div> */}
          <div className={style.options}>
            <span className={style.title}>שם הקורס</span>
            <RegularInput
              height="5.2vh"
              hasError={!courseValue && inputError ? true : false}
              borderColor={!courseValue && inputError ? "red" : "white"}
              placeholder="שם הקורס"
              value={courseValue}
              setValue={setCourseValue}
              suffix={
                courseValue ? (
                  <CloseCircleOutlined
                    onClick={() => setCourseValue("")}
                    style={{ fontSize: "2vh", height: "1.5vh" }}
                  />
                ) : (
                  <EditIcon style={{ fontSize: "0.2vh", height: "1.5vh" }} />
                )
              }
            />
          </div>
          <div className={style.options}>
            <span className={style.title}>אורך קורס משוער</span>
            <Select
              placeholder="אורך קורס משוער"
              value={courseDorationValue}
              onSelect={(value) => setCourseDorationValue(value)}
              onClear={() => setCourseDorationValue(undefined)}
              options={options}
              suffixIcon={
                courseDorationValue ? (
                  <CloseCircleOutlined
                    onClick={() => setCourseDorationValue(undefined)}
                    style={{ fontSize: "2vh", height: "1.5vh" }}
                  />
                ) : (
                  <EditIcon style={{ fontSize: "0.2vh", height: "1.5vh" }} />
                )
              }
              style={{
                height: "5.2vh",
              }}
            />
          </div>

          <div className={style.options}>
            <span className={style.title}>תיאור הקורס</span>
            <RegularInput
              height="5.2vh"
              placeholder="תיאור הקורס (אופציונלי)"
              value={courseDescripition}
              setValue={setCourseDescripition}
              maxLength={250}
              suffix={
                courseSymbolValue ? (
                  <CloseCircleOutlined
                    onClick={() => setCourseDescripition("")}
                    style={{ fontSize: "2vh", height: "1.5vh" }}
                  />
                ) : (
                  <EditIcon style={{ fontSize: "0.2vh", height: "1.5vh" }} />
                )
              }
            />
          </div>
          <div className={style.options}>
            <span className={style.title}>מיקום</span>
            <RegularInput
              height="5.2vh"
              placeholder=" מיקום (אופציונלי)"
              value={courseLocation}
              setValue={setCourseLocation}
              suffix={
                courseSymbolValue ? (
                  <CloseCircleOutlined
                    onClick={() => setCourseLocation("")}
                    style={{ fontSize: "2vh", height: "1.5vh" }}
                  />
                ) : (
                  <EditIcon style={{ fontSize: "0.2vh", height: "1.5vh" }} />
                )
              }
            />
          </div>
        </div>
        <Button className={style.confirmButton} onClick={addCourse}>
          קורס חדש +
        </Button>
      </GenericModal>
      <style>
        {`
          .ant-input-search
         .ant-input-group
          .ant-input-affix-wrapper:not(:last-child) {
            border-start-start-radius: 40px;
            height: 5.1vh;
            border-end-start-radius: 40px;
            border:${inputError ? "1px solid red" : "none"};
          }
         .ant-input-search
            > .ant-input-group
            > .ant-input-group-addon:last-child {
            border: 0;
            background-color: rgba(244, 241, 235, 1);          
          }
         .ant-input-search
            > .ant-input-group
            > .ant-input-group-addon:last-child
            .ant-input-search-button:not(.ant-btn-color-primary) {
            color: rgba(0, 0, 0, 0.45);
            background-color:${
              inputError ? "rgba(255,241,240,1)" : "rgba(244, 241, 235, 1)"
            };
            border: ${inputError ? "1px solid red" : "rgba(244, 241, 235, 1)"};
            border-right: none;
            border-end-end-radius: 40px;
            height: 5vh;
            border-start-end-radius: 40px;
          }
         .ant-btn [class^="ant-btn"],.ant-btn [class*=" ant-btn"] {
            box-sizing: border-box;
            font-size: 2vh;
            margin-left: 0.5vw;
            color: #4f4f4e;
          }
         .ant-select-single .ant-select-selector .ant-select-selection-search-input {
          width: 100%;
          -webkit-appearance: textfield;
          margin-block: -1vh;
          }
        `}
      </style>
    </ConfigProvider>
  );
};

export default AddCourseModal;
