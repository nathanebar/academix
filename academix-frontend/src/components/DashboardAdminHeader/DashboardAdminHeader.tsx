import { useEffect, useRef, useState } from "react";
import styles from "./AdminHeader.module.css";
import {
  Button,
  Dropdown,
  Input,
  notification,
  Popconfirm,
} from "antd";
import {
  CheckOutlined,
  CloseOutlined,
  MoreOutlined,
  SearchOutlined,
} from "@ant-design/icons";
import BlackButton from "../../UI/Button/BlackButton";
import { useSelectionsStore } from "../../store/selectionStore";
import { useSelectionHandler } from "../../hooks/useSelectionHandler";
import { useFilteredDataStore } from "../../store/filteredDataStore";
import {
  filterTeamsByBatch,
  filterCoursesBySelection,
  filterBatchesBySelection,
} from "../../utils/filterUtils";
import { usePermissionStore } from "../../store/permissionStore";
import {
  deleteDomain,
  updateDomain,
} from "../../services/ApiServices";
import Notification from "../../UI/Notification/Notification";
import AddDomainModal from "../Modals/AddDomain/AddDomainModal";
import EditDomainModal from "../Modals/EditDomain/EditDomainModal";
import { Domain } from "../../types/types";
import { queryClient } from "../../api/queryClient";
import { updateDomainsData, useCourseBatchesData, useCoursesData, useDomainsData, useTeamsData } from "../../hooks/useHierarchyData";

const DashboardAdminHeader = () => {
  const [currentDomain, setCurrentDomain] = useState<string | number>();
  const [editDomainName, setEditDomainName] = useState<boolean>(false);
  const [domainName, setDomainName] = useState<string>("");
  const [addDomainModalOpen, setAddDomainModalOpen] = useState<boolean>(false);
  const [editDomainModalOpen, setEditDomainModalOpen] = useState<boolean>(false);
  const [selectedDomainForEdit, setSelectedDomainForEdit] = useState<Domain | null>(null);

  const inputRef = useRef<any>(null);
  const {
    setSelectedDomain,
    selectedDomain,
    setSelectedCourse,
    setSelectedCourseBatch,
    setSelectedTeam,
    setSelectedTeamMember,
    selectedSystemId,
  } = useSelectionsStore();
  const { setFilteredCourses, setFilteredCourseBatches, setFilteredTeams } =
    useFilteredDataStore();
  const { selectedPermission, setSelectedPermission } = usePermissionStore();
  const { filteredDomains, setFilteredDomains } = useFilteredDataStore();
  const domains = useDomainsData();
  const teams = useTeamsData();
  const courses = useCoursesData();
  const courseBatches = useCourseBatchesData();
  
  const { handleSelectionChange } = useSelectionHandler(
    courses,
    courseBatches,
    teams,
    setSelectedDomain,
    setSelectedCourse,
    setSelectedCourseBatch,
    setSelectedTeam,
    setSelectedTeamMember,
    setFilteredCourses,
    setFilteredCourseBatches,
    setFilteredTeams,
    () => {},
    filterCoursesBySelection,
    filterBatchesBySelection,
    filterTeamsByBatch
  );

  const handleActionClick = async (
    action: string,
    domain: Domain
  ) => {
    if (action === "edit") {
      setSelectedDomainForEdit(domain);
      setEditDomainModalOpen(true);
    }
    if (action === "delete") {
      const deletingDomain = await deleteDomain(domain.id);
      const newAllowedDomainIds = selectedPermission?.allowedDomainIds?.filter(
        (id: string | number) => id !== domain.id
      );

      setSelectedPermission({
        ...selectedPermission,
        allowedDomainIds: newAllowedDomainIds,
      });
      if (deletingDomain.status === 200) {
        Notification({
          type: "success",
          msg: "מחיקת התחום בוצעה בהצלחה!",
        });
      }
    }
  };

  const handleFilterCourse = (value: string) => {
    if (!value.trim()) {
      const domainFilteredCourses = courses.filter(
        (course) => course.domainId === selectedDomain?.id
      );
      setFilteredCourses(domainFilteredCourses);
      return;
    }
    const domainFilteredCourses = courses.filter(
      (course) => course.domainId === selectedDomain?.id
    );
    const filteredData = domainFilteredCourses?.filter((item) => {
      return item.name?.toLowerCase().includes(value?.toLowerCase());
    });
    setFilteredCourses(filteredData);
  };

  useEffect(() => {
    if (domains && domains.length > 0) {
      setCurrentDomain(selectedDomain?.id || domains[0]?.id);
    }
  }, [domains, selectedDomain]);

  return (
    <>
      <div className={styles["container"]}>
        <div style={{ display: "flex", maxWidth: "80%", width: "100%" }}>
          <div className={styles["menu-container"]}>
            {filteredDomains?.map((domain, index) => (
              <div
                style={{ display: "flex", justifyContent: "space-between" }}
                key={index}
              >
                <Button
                  className={`${styles["btns"]} ${currentDomain === domain.id ? styles["active-btn"] : ""}`}
                  onClick={() => [
                    setCurrentDomain(domain.id),
                    handleSelectionChange("domain", domain),
                    editDomainName && domain.id !== currentDomain
                      ? setEditDomainName(false)
                      : "",
                  ]}
                >
                  {editDomainName && currentDomain === domain.id ? (
                    <div>
                      <Input
                        value={domainName}
                        onChange={(e) => setDomainName(e.target.value)}
                        onKeyDown={async (e) => {
                          if (e.key === "Enter") {
                            const updateDomainData = {
                              name: domainName,
                            };
                            if (domainName?.trim() === "") {
                              Notification({
                                type: "error",
                                msg: "נא הכנס שם חדש למחזור!",
                              });
                              return;
                            } else if (domainName.trim()) {
                              const trimmedName = domainName.trim();
                              const words = trimmedName.split(" ");
                              const exceedsWords = words.length > 3;
                              const exceedsChars = trimmedName.length > 12;
                              if (exceedsWords || exceedsChars) {
                                notification.error({
                                  message: "השם ארוך מדי!",
                                  description: exceedsWords
                                    ? "שם התחום יכול להכיל עד 3 מילים בלבד"
                                    : "שם התחום יכול להכיל עד 12 תווים בלבד",
                                  duration: 4,
                                  placement: "top",
                                  style: { direction: "rtl" },
                                });
                                return;
                              }
                              await updateDomain(updateDomainData, domain.id);
                              const updatedDomains = domains?.map(
                                (domainItem) =>
                                  domainItem.id === domain.id
                                    ? { ...domainItem, name: domainName }
                                    : domainItem
                              );
                              updateDomainsData(() => updatedDomains); // cache of the domains query (#17)
                              setEditDomainName(false);
                            }
                          }
                        }}
                        style={{
                          width: "120px",
                          height: "4vh",
                        }}
                      />
                      <CheckOutlined
                        style={{
                          fontSize: "18px",
                          marginRight: "0.5vw",
                          color: "green",
                          cursor: "pointer",
                        }}
                        onClick={async () => {
                          const updateDomainData = {
                            name: domainName,
                          };
                          if (domainName?.trim() === "") {
                            Notification({
                              type: "error",
                              msg: "נא הכנס שם חדש למחזור!",
                            });
                            return;
                          } else if (domainName.trim()) {
                            const trimmedName = domainName.trim();
                            const words = trimmedName.split(" ");
                            const exceedsWords = words.length > 3;
                            const exceedsChars = trimmedName.length > 12;
                            if (exceedsWords || exceedsChars) {
                              notification.error({
                                message: "השם ארוך מדי!",
                                description: exceedsWords
                                  ? "שם התחום יכול להכיל עד 3 מילים בלבד"
                                  : "שם התחום יכול להכיל עד 12 תווים בלבד",
                                duration: 4,
                                placement: "top",
                                style: { direction: "rtl" },
                              });
                              return;
                            }
                            await updateDomain(updateDomainData, domain.id);
                            const updatedDomains = domains?.map((domainItem) =>
                              domainItem.id === domain.id
                                ? { ...domainItem, name: domainName }
                                : domainItem
                            );
                            updateDomainsData(() => updatedDomains); // cache of the domains query (#17)
                            setEditDomainName(false);
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
                          setEditDomainName(false);
                        }}
                      />
                    </div>
                  ) : (
                    domain.name
                  )}
                  {selectedPermission?.scope_type === "system" && (
                    <Dropdown
                      placement="bottomLeft"
                      menu={{
                        items: [
                          {
                            key: "edit",
                            label: "עריכת תחום",
                            onClick: () => handleActionClick("edit", domain),
                            style: { borderBottom: "1px solid #f0f0f0" },
                          },
                          {
                            key: "delete",
                            label: (
                              <Popconfirm
                                title="האם אתה בטוח שברצונך למחוק את התחום?"
                                description="פעולה זו לא ניתנת לביטול"
                                onConfirm={() =>
                                  handleActionClick("delete", domain)
                                }
                                okText="כן, מחק"
                                cancelText="ביטול"
                                placement="left"
                              >
                                <div style={{ color: "red" }}>מחיקה</div>
                              </Popconfirm>
                            ),
                            style: { borderBottom: "1px solid #f0f0f0" },
                          },
                        ],
                      }}
                      trigger={["click"]}
                    >
                      <div>
                        <MoreOutlined
                          style={{
                            color:
                              currentDomain === domain.id
                                ? "black"
                                : "transparent",
                            cursor: "pointer",
                            fontWeight: "bold",
                          }}
                          className={styles["moreIcon"]}
                        />
                      </div>
                    </Dropdown>
                  )}
                </Button>
              </div>
            ))}
          </div>

          {selectedPermission?.scope_type === "system" && (
            <div
              style={{ paddingRight: domains.length > 5 ? "1vw" : "0.5vw" }}
              className={styles["domainInputWarp"]}
            >
              <BlackButton
                onclickProps={() => setAddDomainModalOpen(true)}
                width="7.3vw"
                height="4vh"
              >
                <div>
                  <p
                    style={{
                      width: "100%",
                      display: "flex",
                      justifyContent: "space-between",
                      fontSize: "15px",
                    }}
                  >
                    הוספת תחום
                  </p>
                </div>
                <span style={{ color: "white", fontSize: "large" }}>+</span>
              </BlackButton>
            </div>
          )}
        </div>

        <div className={styles["inputsClass"]}>
          <Input
            style={{ backgroundColor: "white" }}
            type="search"
            className={styles["search-input"]}
            onChange={(e) => {
              handleFilterCourse(e.target.value);
            }}
            placeholder="חיפוש קורס"
            suffix={<SearchOutlined onClick={() => { }} />}
          />
        </div>
      </div>
      <AddDomainModal
        isOpen={addDomainModalOpen}
        setIsOpen={setAddDomainModalOpen}
      />
      <EditDomainModal
        isOpen={editDomainModalOpen}
        setIsOpen={setEditDomainModalOpen}
        domain={selectedDomainForEdit}
        onSuccess={() => {
          queryClient.invalidateQueries({
            queryKey: ["domains"],
          });
        }}
      />
    </>
  );
};

export default DashboardAdminHeader;