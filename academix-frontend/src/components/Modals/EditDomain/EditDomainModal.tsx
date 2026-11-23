import React, { useEffect, useState } from "react";
import GenericModal from "../GenericModal";
import style from "../AddDomain/AddDomainModal.module.css";
import {
  AutoComplete,
  Button,
  ConfigProvider,
  Input,
  notification,
  Tag,
} from "antd";
import { ReactComponent as EditIcon } from "../../../media/icons/Edit Icon.svg";
import he_IL from "antd/locale/he_IL";
import RegularInput from "../../../UI/Input/Input/RegularInput";
import { CloseCircleOutlined, UserOutlined, PlusOutlined } from "@ant-design/icons";
import {
  updateDomain,
  createUser,
  createRoleAssigment,
  getUserByUsername,
  getAllRoleAssigments,
  getAllUsers,
  deleteRoleAssigment,
} from "../../../services/ApiServices";
import Notification from "../../../UI/Notification/Notification";
import { usePermissionStore } from "../../../store/permissionStore";
import { OnSearch } from "../../../utils/OnSearch";
import { queryClient } from "../../../api/queryClient";
import { Domain } from "../../../types/types";
import { updateDomainsData, useDomainsData } from "../../../hooks/useHierarchyData";

type DomainManager = {
  id?: string;
  username: string;
  name: string;
  fullName?: string;
  personalNumber?: string;
  militaryid?: string;
  roleAssignmentId?: number;
  isNew?: boolean;
};

const sanitizeMilitaryId = (value: string): string => {
  if (!value) return "0000000";
  const digits = value.replace(/\D/g, "");
  return digits.padStart(7, "0").slice(0, 7);
};

type EditDomainModalProps = {
  isOpen: boolean;
  setIsOpen: (open: boolean) => void;
  domain: Domain | null;
  onSuccess: () => void;
};

const EditDomainModal: React.FC<EditDomainModalProps> = ({
  isOpen,
  setIsOpen,
  domain,
  onSuccess,
}) => {
  const [domainNameValue, setDomainNameValue] = useState<string>("");
  const [currentManagers, setCurrentManagers] = useState<DomainManager[]>([]);
  const [newManager, setNewManager] = useState<DomainManager | null>(null);
  const [resultsObj, setResultsObj] = useState<any>([]);
  const [results, setResults] = useState<any>([]);
  const [searchInputValue, setSearchInputValue] = useState<string>("");
  const [inputError, setInputError] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [pendingRemovals, setPendingRemovals] = useState<DomainManager[]>([]); 

  const domains = useDomainsData();
  const { selectedPermission, setSelectedPermission } = usePermissionStore();

  useEffect(() => {
    if (isOpen && domain) {
      setDomainNameValue(domain.name || "");
      setSearchInputValue("");
      setResults([]);
      setResultsObj([]);
      setInputError(false);
      setNewManager(null);
      setPendingRemovals([]);
      loadCurrentManagers();
    }
  }, [isOpen, domain]);

  const loadCurrentManagers = async () => {
    if (!domain?.id) return;

    try {
      const allRoles = await getAllRoleAssigments();
      const domainManagerRoles = allRoles.filter(
        (role: any) =>
          role.role_code === "DOMAIN_MANAGER" &&
          role.scope_id === domain.id
      );

      if (domainManagerRoles && domainManagerRoles.length > 0) {
        const allUsers = await getAllUsers();

        const managers: DomainManager[] = domainManagerRoles.map((role: any) => {
          const user = allUsers.find((u: any) => u.id === role.user_id);
          return {
            id: user?._id || user?.id,
            username: user?.username || role.username,
            name: user?.name || "לא ידוע",
            personalNumber: user?.militaryid || "",
            militaryid: user?.militaryid || "",
            roleAssignmentId: role.id,
            isNew: false,
          };
        });

        setCurrentManagers(managers);
      } else {
        setCurrentManagers([]);
      }
    } catch (error) {
      setCurrentManagers([]);
    }
  };

  const markManagerForRemoval = (managerToRemove: DomainManager) => {
    if (!managerToRemove.id) {
      notification.error({
        message: "ישנה בעיה!",
        description: "לא ניתן לסמן מנהל זה להסרה - חסר מזהה",
        duration: 3,
        placement: "topRight",
        style: { direction: "rtl" },
      });
      return;
    }

    setPendingRemovals(prev => [...prev, managerToRemove]);
    setCurrentManagers(prev => prev.filter(m => m.username !== managerToRemove.username));
  };

  const editDomainWithManager = async () => {
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

    const allManagers = [...currentManagers];
    if (newManager) {
      allManagers.push(newManager);
    }

    if (allManagers.length === 0) {
      Notification({ type: "error", msg: "נא הכנס מנהל תחום!" });
      setInputError(true);
      return;
    }

    setIsLoading(true);

    try {
      if (trimmedName !== domain?.name) {
        const updateDomainData = {
          name: trimmedName,
        };

        const updatingDomain = await updateDomain(updateDomainData, domain?.id);

        if (updatingDomain.status !== 200) {
          notification.error({
            message: "ישנה בעיה!",
            description: "שם התחום לא עודכן",
            duration: 4,
            placement: "topRight",
            style: { direction: "rtl" },
          });
          setIsLoading(false);
          return;
        }

        const updatedDomains = domains?.map((d) =>
          d.id === domain?.id ? { ...d, name: trimmedName } : d
        );
        updateDomainsData(() => updatedDomains); // cache of the domains query (#17)
      }

      if (pendingRemovals.length > 0) {
        for (const manager of pendingRemovals) {
          if (!manager.id || !domain?.id) {
            notification.error({
              message: "ישנה בעיה!",
              description: `לא ניתן להסיר את ${manager.name} - חסר מזהה`,
              duration: 3,
              placement: "topRight",
              style: { direction: "rtl" },
            });
            continue;
          }

          try {
            const deleteResponse = await deleteRoleAssigment(
              Number(manager.id),    
              Number(domain.id)       
            );

          } catch (error) {
            notification.error({
              message: "ישנה בעיה!",
              description: `לא ניתן להסיר את ${manager.name}`,
              duration: 3,
              placement: "topRight",
              style: { direction: "rtl" },
            });
          }
        }
      }

      if (newManager && newManager.username) {
        let existingUser = null;
        try {
          existingUser = await getUserByUsername(newManager.username);
        } catch (e) {
        }

        if (!existingUser) {
          const sanitizedMilitaryId = sanitizeMilitaryId(
            newManager.militaryid || newManager.personalNumber || ""
          );

          const userData = {
            username: newManager.username,
            name: newManager.name || newManager.fullName,
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

          await new Promise(resolve => setTimeout(resolve, 500));
        }

        const roleAssigmentData = {
          username: newManager.username,
          role_code: "DOMAIN_MANAGER",
          scope_type: "domain",
          scope_id: domain?.id,
          domain_id: domain?.id,
        };

        const roleAssignmentResponse = await createRoleAssigment(roleAssigmentData);

        if (!roleAssignmentResponse || (roleAssignmentResponse.status !== 201 && roleAssignmentResponse.status !== 200)) {
          notification.error({
            message: "ישנה בעיה!",
            description: roleAssignmentResponse?.data?.error || "הרשאת מנהל התחום לא נוצרה",
            duration: 4,
            placement: "topRight",
            style: { direction: "rtl" },
          });
          setIsLoading(false);
          return;
        }
      }

      queryClient.invalidateQueries({
        queryKey: ["permissions"],
      });

      notification.success({
        message: "מזל טוב!",
        description: "התחום עודכן בהצלחה!",
        duration: 4,
        placement: "topRight",
        style: { direction: "rtl" },
      });

      onSuccess();
      setIsOpen(false);
      resetForm();
    } catch (error) {
      console.log("שגיאה בתהליך:", error);
      notification.error({
        message: "ישנה בעיה!",
        description: "התחום לא עודכן!",
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
    setCurrentManagers([]);
    setNewManager(null);
    setPendingRemovals([]);
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

      const userData: DomainManager = {
        id: user._id,
        username: user.username,
        name: user.name || user.fullName,
        personalNumber: user.personalNumber,
        militaryid: user.personalNumber || user.militaryid,
        isNew: true,
      };

      setNewManager(userData);
      setResults([]);
    } catch (error) {
      console.log("שגיאה בבחירת משתמש:", error);
    }
  };

  const HandleOnSearch = async (value: string) => {
    await OnSearch(value, searchInputValue, setResults, setResultsObj);
  };

  const handleClearNewManager = () => {
    setNewManager(null);
    setSearchInputValue("");
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
        title="עריכת תחום"
      >
        <div className={style.mainContainer}>
          <div className={style.options}>
            <span className={style.title}>מנהלי התחום הנוכחיים</span>
            <div className={style.managersContainer}>
              {currentManagers.length > 0 ? (
                <div className={style.managersList}>
                  {currentManagers.map((manager, index) => (
                    <Tag
                      key={manager.username + index}
                      closable
                      onClose={(e) => {
                        e.preventDefault();
                        markManagerForRemoval(manager);
                      }}
                      className={style.managerTag}
                      closeIcon={
                        <CloseCircleOutlined style={{ color: "#ff4d4f" }} />
                      }
                    >
                      <UserOutlined style={{ marginLeft: 8 }} />
                      {manager.name}
                    </Tag>
                  ))}
                </div>
              ) : (
                <span className={style.noManagers}>אין מנהלי תחום</span>
              )}
            </div>
          </div>

          <div className={style.options}>
            <span className={style.title}>הוספת מנהל תחום נוסף</span>
            {newManager ? (
              <div className={style.selectedManagerContainer}>
                <Tag
                  className={style.selectedManagerTag}
                  closable
                  onClose={handleClearNewManager}
                  closeIcon={
                    <CloseCircleOutlined style={{ color: "#ff4d4f" }} />
                  }
                >
                  <UserOutlined style={{ marginLeft: 8 }} />
                  {newManager.name}
                </Tag>
              </div>
            ) : (
              <AutoComplete
                options={results}
                onSelect={(value) => {
                  setSearchInputValue(value);
                  GetUserFromArr(value);
                }}
                value={searchInputValue}
              >
                <Input.Search
                  placeholder="חפש מנהל תחום חדש"
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
            )}
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
          onClick={editDomainWithManager}
          loading={isLoading}
        >
          שמור שינויים
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
            background-color: ${inputError ? "rgba(255,241,240,1)" : "rgba(244, 241, 235, 1)"
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

export default EditDomainModal;