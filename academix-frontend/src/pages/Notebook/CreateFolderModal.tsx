// "New folder" modal of the Notebook page (split out of Notebook.tsx, issue #125).
import React, { useRef } from "react";
import { Alert, Input, InputRef, Modal, Radio } from "antd";
import { FolderOutlined } from "@ant-design/icons";
import { cssVar, radius } from "../../theme/tokens";

export type FolderScope = "personal" | "team";

type Props = {
  open: boolean;
  creating: boolean;
  folderScope: FolderScope;
  setFolderScope: (scope: FolderScope) => void;
  name: string;
  setName: (name: string) => void;
  showScopeChoice: boolean;
  selectedTeamMember: any;
  onCreate: () => void;
  onCancel: () => void;
};

export default function CreateFolderModal({
  open,
  creating,
  folderScope,
  setFolderScope,
  name,
  setName,
  showScopeChoice,
  selectedTeamMember,
  onCreate,
  onCancel,
}: Props) {
  const inputRef = useRef<InputRef>(null);

  return (
    <Modal
      title="יצירת תיקייה חדשה"
      open={open}
      onOk={onCreate}
      onCancel={onCancel}
      // autoFocus on the Input runs before the open animation ends, so it never got the focus
      afterOpenChange={(isOpen) => {
        if (isOpen) inputRef.current?.focus();
      }}
      okText="צור תיקייה"
      cancelText="ביטול"
      confirmLoading={creating}
      okButtonProps={{
        style: {
          background: cssVar("plum"),
          borderColor: cssVar("plum"),
          borderRadius: radius.md,
        },
      }}
    >
      <div style={{ marginBottom: 16 }}>
        {folderScope === "personal" && selectedTeamMember ? (
          <Alert
            type="info"
            showIcon
            message={
              <span>
                יוצרים תיקייה אישית עבור{" "}
                <strong>{selectedTeamMember.name || selectedTeamMember.User?.name}</strong>
              </span>
            }
          />
        ) : folderScope === "team" ? (
          <Alert type="success" showIcon message={<span>יוצרים תיקייה משותפת לכל הצוות</span>} />
        ) : (
          <Alert
            type="warning"
            showIcon
            message={<span>לא נבחר חייל – לא ניתן ליצור תיקייה אישית</span>}
          />
        )}
      </div>

      {/* רק אם המשתמש אינו STUDENT – בחירת קהל */}
      {showScopeChoice && (
        <div style={{ marginBottom: 16 }}>
          <Radio.Group
            value={folderScope}
            onChange={(e) => setFolderScope(e.target.value)}
            optionType="button"
            buttonStyle="solid"
            style={{ width: "100%" }}
          >
            <Radio.Button value="personal" style={{ width: "50%", textAlign: "center" }}>
              אישית
            </Radio.Button>
            <Radio.Button value="team" style={{ width: "50%", textAlign: "center" }}>
              לכל הצוות
            </Radio.Button>
          </Radio.Group>
        </div>
      )}

      <Input
        ref={inputRef}
        placeholder="הזן שם לתיקייה..."
        value={name}
        onChange={(e) => setName(e.target.value)}
        onPressEnter={onCreate}
        autoFocus
        size="large"
        prefix={<FolderOutlined style={{ color: cssVar("antGray6") }} />}
      />
    </Modal>
  );
}
