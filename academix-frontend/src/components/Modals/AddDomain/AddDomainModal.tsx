import React, { useEffect, useState } from "react";
import GenericModal from "../GenericModal";
import style from "./AddDomainModal.module.css";
import {
  AutoComplete,
  Button,
  ConfigProvider,
  Input,
  notification,
} from "antd";
import { ReactComponent as EditIcon } from "../../../media/icons/Edit Icon.svg";
import he_IL from "antd/locale/he_IL";
import RegularInput from "../../../UI/Input/Input/RegularInput";
import { CloseCircleOutlined } from "@ant-design/icons";
import {
  addDomain,
  createRoleAssigment,
  createUser,
  getUserByUsername,
} from "../../../services/ApiServices";
import Notification from "../../../UI/Notification/Notification";
import { useSelectionsStore } from "../../../store/selectionStore";
import { usePermissionStore } from "../../../store/permissionStore";
import { useFilteredDataStore } from "../../../store/filteredDataStore";
import { useDomainStore } from "../../../store/domainStore";
import { OnSearch } from "../../../utils/OnSearch";
import { Assignment } from "../../../types/types";
import { queryClient } from "../../../api/queryClient";

type AddDomainModalProps = {
  isOpen: boolean;
  setIsOpen: (open: boolean) => void;
};

const sanitizeMilitaryId = (value: string): string => {
  if (!value) return "0000000";
  const digits = value.replace(/\D/g, "");
  return digits.padStart(7, "0").slice(0, 7);
};

const AddDomainModal: React.FC<AddDomainModalProps> = ({
  isOpen,
  setIsOpen,
}) => {
  const [domainNameValue, setDomainNameValue] = useState<string>("");
  const [domainManager, setDomainManager] = useState<any>({});
  const [resultsObj, setResultsObj] = useState<any>([]);
  const [results, setResults] = useState<any>([]);
  const [searchInputValue, setSearchInputValue] = useState<string>("");
  const [inputError, setInputError] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(false);

  const { selectedSystemId } = useSelectionsStore();
  const { selectedPermission, setSelectedPermission } = usePermissionStore();
  const { setFilteredDomains } = useFilteredDataStore();
  const { domains, setDomains } = useDomainStore();

  useEffect(() => {
    if (!isOpen) {
      setInputError(false);
      setDomainNameValue("");
      setDomainManager({});
      setSearchInputValue("");
      setResults([]);
      setResultsObj([]);
      setIsLoading(false);
    }
  }, [isOpen]);

  const addDomainWithManager = async () => {
    if (!domainNameValue.trim()) {
      Notification({ type: "error", msg: "נא הכנס שם תחום!" });
      setInputError(true);
      return;
    }

    const trimmedName = domainNameValue.trim();
    const words = trimmedName.split(" ");
    const exceedsWords = words.length > 3;
    const exceedsChars = trimmedName.length > 12;

    if (exceedsWords || exceedsChars) {
      notification.warning({
        message: "השם ארוך מדי!",
        description: exceedsWords
          ? "שם התחום יכול להכיל עד 3 מילים בלבד"
          : "שם התחום יכול להכיל עד 12 תווים בלבד",
        duration: 4,
        placement: "topRight",
        style: { direction: "rtl" },
      });
      return;
    }

    if (Object.keys(domainManager).length <= 0) {
      Notification({ type: "error", msg: "נא הכנס מנהל תחום!" });
      setInputError(true);
      return;
    }

    if (!domainManager.username) {
      Notification({ type: "error", msg: "נא בחר מנהל תחום תקין!" });
      setInputError(true);
      return;
    }

    setIsLoading(true);

    try {
      let existingUser = null;
      try {
        existingUser = await getUserByUsername(domainManager.username);
      } catch (e) {
      }

      if (!existingUser) {
        const sanitizedMilitaryId = sanitizeMilitaryId(
          domainManager.militaryid || domainManager.personalNumber
        );

        const userData = {
          username: domainManager.username,
          name: domainManager.name || domainManager.fullName,
          militaryid: sanitizedMilitaryId,
          password: "12345",
        };

        const userResponse = await createUser(userData);

        if (userResponse?.status && userResponse.status !== 200 && userResponse.status !== 201) {
          notification.error({
            message: "ישנה בעיה!",
            description: userResponse.data?.error || "המשתמש לא נוצר",
            duration: 4,
            placement: "topRight",
            style: { direction: "rtl" },
          });
          setIsLoading(false);
          return;
        }

        try {
          existingUser = await getUserByUsername(domainManager.username);
        } catch (e) {
        }
      }

      const systemId = selectedSystemId ?? selectedPermission?.scope_id;

      const domainData: any = {
        name: trimmedName,
      };

      if (systemId && typeof systemId === "number" && systemId > 0) {
        domainData.systemId = systemId;
      }

      const creatingDomain = await addDomain(domainData);

      if (creatingDomain.status !== 201) {
        if (creatingDomain.status === 409) {
          Notification({ type: "error", msg: "תחום זה כבר קיים!" });
        } else {
          notification.error({
            message: "ישנה בעיה!",
            description: creatingDomain.data?.error || "התחום לא נוסף",
            duration: 4,
            placement: "topRight",
            style: { direction: "rtl" },
          });
        }
        setIsLoading(false);
        return;
      }

      const roleAssigmentData = {
        username: domainManager.username,
        role_code: "DOMAIN_MANAGER",
        scope_type: "domain",
        scope_id: creatingDomain.data.id,
        domain_id: creatingDomain.data.id,
      };

      const creatingRoleAssiment = await createRoleAssigment(roleAssigmentData);

      if (!creatingRoleAssiment || (creatingRoleAssiment.status !== 201 && creatingRoleAssiment.status !== 200)) {
        notification.error({
          message: "ישנה בעיה!",
          description: creatingRoleAssiment?.data?.error || "הרשאת מנהל התחום לא נוצרה",
          duration: 4,
          placement: "topRight",
          style: { direction: "rtl" },
        });
        setIsLoading(false);
        return;
      }

      if (existingUser) {
        const newPermission: Assignment = {
          id: creatingRoleAssiment.data?.id || Date.now(),
          user_id: existingUser.id || existingUser._id || 0,
          role_code: "DOMAIN_MANAGER",
          scope_type: "domain",
          scope_id: creatingDomain.data.id,
          scopeName: trimmedName,
          role_name: "מנהל תחום",
          allowedTeamIds: [],
          allowedCourseIds: [],
          allowedCourseBatcheIds: [],
          allowedAxisIds: [],
          allowedDomainIds: [creatingDomain.data.id],
        };
      }

      const newAllowedDomainIds = [
        ...(selectedPermission?.allowedDomainIds || []),
        creatingDomain.data.id,
      ];

      setSelectedPermission({
        ...selectedPermission,
        allowedDomainIds: newAllowedDomainIds,
      });

      queryClient.invalidateQueries({
        queryKey: ["permissions"],
      });

      setDomains([...domains, creatingDomain.data]);

      notification.success({
        message: "מזל טוב!",
        description: "התחום נוצר בהצלחה!",
        duration: 4,
        placement: "topRight",
        style: { direction: "rtl" },
      });

      setIsOpen(false);
      resetForm();
    } catch (error) {
      console.log("שגיאה בתהליך:", error);
      notification.error({
        message: "ישנה בעיה!",
        description: "התחום לא נוסף!",
        duration: 4,
        placement: "topRight",
        style: { direction: "rtl" },
      });
    } finally {
      setIsLoading(false);
    }
  };

  const resetForm = () => {
    setDomainNameValue("");
    setDomainManager({});
    setSearchInputValue("");
    setResults([]);
    setResultsObj([]);
    setInputError(false);
  };

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
        id: user._id,
        username: user.username,
        name: user.name || user.fullName,
         militaryid: user.personalNumber || user.militaryid, 
        personalNumber: user.personalNumber,
      };

      setDomainManager(userData);
      setResults([]);
    } catch (error) {
      console.log("שגיאה בבחירת משתמש:", error);
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
              !domainNameValue && inputError
                ? "rgba(255,241,240,1)"
                : "rgba(244, 241, 235, 1)",
            colorTextPlaceholder: "rgba(94,99,102,1)",
            borderRadius: 20,
          },
          Button: {
            defaultHoverBg: "none",
            colorPrimaryHover: "#3d3e8d",
          },
        },
      }}
    >
      <GenericModal
        isOpen={isOpen}
        setIsOpen={setIsOpen}
        width="35vw"
        title="הוספת תחום חדש"
      >
        <div className={style.mainContainer}>
          <div className={style.options}>
            <span className={style.title}>מנהל התחום</span>
            <AutoComplete
              options={results}
              onSelect={(value) => {
                setSearchInputValue(value);
                GetUserFromArr(value);
              }}
              value={searchInputValue}
            >
              <Input.Search
                placeholder="מנהל התחום"
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
          </div>

          <div className={style.options}>
            <span className={style.title}>שם התחום</span>
            <RegularInput
              height="5.2vh"
              hasError={!domainNameValue && inputError ? true : false}
              borderColor={!domainNameValue && inputError ? "red" : "white"}
              placeholder="שם התחום"
              value={domainNameValue}
              setValue={setDomainNameValue}
              suffix={
                domainNameValue ? (
                  <CloseCircleOutlined
                    onClick={() => setDomainNameValue("")}
                    style={{ fontSize: "2vh", height: "1.5vh" }}
                  />
                ) : (
                  <EditIcon style={{ fontSize: "0.2vh", height: "1.5vh" }} />
                )
              }
            />
          </div>
        </div>

        <Button
          className={style.confirmButton}
          onClick={addDomainWithManager}
          loading={isLoading}
        >
          הוספת תחום +
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
            border: ${inputError ? "1px solid red" : "none"};
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
            background-color: ${
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
        `}
      </style>
    </ConfigProvider>
  );
};

export default AddDomainModal;