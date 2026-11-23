import React, { useEffect, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { notebookKeys } from "../../api/queryKeys";
import { List, Spin, Empty, Alert, Card, Typography, message, Popconfirm, Button, Modal, Input, Tooltip, Radio } from "antd";
import { FolderOutlined, FileTextOutlined, ClockCircleOutlined, DeleteColumnOutlined, DeleteFilled, PlusOutlined, CloseOutlined, TeamOutlined, UserOutlined } from "@ant-design/icons";

import styles from "./Notebook.module.css";
import {
  GetNoteBookFolders,
  GetNoteBookNotes,
  CreateNoteBookNote,
  UpdateNoteBookNote,
  DeleteNoteBookFolder,
  CreateNoteBookFolder,
  DeleteNoteBookNote,
} from "../../services/ApiServices";
import { HeaderPermissionDisplay } from "../../components/HeaderPermissionDisplay";
import { useSelectionsStore } from "../../store/selectionStore";
import NoteEditor from "./NoteEditor/NoteEditor";
import { usePermissionStore } from "../../store/permissionStore";
import { useTeamMembers } from "../../hooks/useTeamMembers";

interface Soldier {
  id: number;
  name: string;
  team_member_id: number;
}

interface Folder {
  id: number;
  name: string;
  team_member_id?: number;
  team_course_batch_id?: number;
  children?: Folder[];
  system_key:string | null
}

interface Note {
  id: number;
  title: string;
  content?: any;
  parent_note_id: number | null;
  replies: Note[];
  creator?:any;
  created_by?:number;
  updated_at?: string | null;
  updatedAt?: string | null;
  created_at?: string | null;
  createdAt?: string | null;
}

const toFolder = (folder: any): Folder => ({
  id: folder.id,
  name: folder.name,
  team_member_id: folder.team_member_id,
  team_course_batch_id: folder.team_course_batch_id,
  system_key: folder.system_key,
});

const Notebook: React.FC = () => {
  const [selectedSoldier, setSelectedSoldier] = useState<Soldier | null>(null);
  const [selectedFolderId, setSelectedFolderId] = useState<number | null>(null);

  const [notes, setNotes] = useState<Note[]>([]);
  const [notesLoading, setNotesLoading] = useState(false);
  const [notesError, setNotesError] = useState<string | null>(null);
  const [editingNote, setEditingNote] = useState<Note | null>(null);
  const [isNewNote, setIsNewNote] = useState(false); // ✅ תיקון: ה-state החסר

  const {
    setSelectedDomain,
    selectedDomain,
    setSelectedCourse,
    selectedCourse,
    setSelectedCourseBatch,
    selectedCourseBatch,
    setSelectedTeam,
    selectedTeam,
    selectedTeamMember,
    setSelectedTeamMember,
    activeHeaderType
  } = useSelectionsStore();



    const { permissions, selectedPermission, setSelectedPermission } =
      usePermissionStore();


    
      
  const [isFolderModalOpen, setIsFolderModalOpen] = useState(false);
const [newFolderName, setNewFolderName] = useState("");
const [creatingFolder, setCreatingFolder] = useState(false);
  const [editingReplyId, setEditingReplyId] = useState<number | null>(null);

const [isAddingReply, setIsAddingReply] = useState(false);
const [folderScope, setFolderScope] = useState<"personal" | "team">("personal");

  // Folders of the current scope (React Query, #17)
  const queryClient = useQueryClient();
  const foldersKey = notebookKeys.folders(
    selectedCourseBatch?.id,
    selectedTeam?.id,
    selectedTeamMember?.id
  );
  const foldersQuery = useQuery({
    queryKey: foldersKey,
    // ok: false = the server answered "no folders" (not an exception)
    queryFn: async (): Promise<{ ok: boolean; folders: Folder[] }> => {
      const res = await GetNoteBookFolders({
        courseBatchId: selectedCourseBatch?.id,
        teamId: selectedTeam?.id,
        team_member_id: selectedTeamMember?.id,
      });
      if (!res?.data?.success) return { ok: false, folders: [] };
      return { ok: true, folders: res.data.data.map(toFolder) };
    },
    staleTime: 0, // refetch on every mount, like the former useEffect
  });
  const folders = foldersQuery.data?.folders ?? [];
  const foldersLoading = foldersQuery.isLoading;
  const foldersError: string | null = foldersQuery.isError
    ? (foldersQuery.error as any)?.message || "שגיאה בשליפת תיקיות"
    : foldersQuery.data && !foldersQuery.data.ok
    ? // (pre-existing: activeHeaderType is "teamMember", so this is always the first message)
      activeHeaderType !== "teammember"
      ? "יש לבחור חבר צוות"
      : "לא נמצאו תיקיות לחייל זה"
    : null;

  // Scope change: reset the selection (UI state; the folders come from the query above)
  useEffect(() => {
    setNotes([]);
    setSelectedFolderId(null);
    setEditingNote(null);
    setIsNewNote(false);
    setNotesError(null);
  }, [
    selectedSoldier,
    selectedTeamMember?.id,
    selectedTeam?.id,
    selectedCourseBatch?.id,
  ]);



const handleCreateFolder = async () => {
  const name = newFolderName.trim();
  if (!name) {
    message.error("הכנס שם לתיקייה");
    return;
  }

  if (!selectedCourseBatch?.id || !selectedTeam?.id) {
    message.error("לא נבחר קורס/קבוצה");
    return;
  }

  // אם scope הוא personal אבל אין חייל נבחר – נעצור
  if (folderScope === "personal" && !selectedTeamMember?.id) {
    message.error("יש לבחור חייל ליצירת תיקייה אישית");
    return;
  }

  setCreatingFolder(true);
  try {
    const res = await CreateNoteBookFolder({
      name,
      teamId: selectedTeam.id,
      courseBatchId: selectedCourseBatch.id,
      // אם scope = team → team_member_id null → משותפת
      team_member_id: folderScope === "team" ? null : selectedTeamMember?.id ?? null,
      system_key: null,
    });

    if (res?.data?.success) {
      message.success("התיקייה נוצרה בהצלחה");
      setNewFolderName("");
      setIsFolderModalOpen(false);
      setFolderScope("personal"); // איפוס ברירת מחדל

      // רענון רשימת התיקיות
      await foldersQuery.refetch();
    } else {
      message.error(res?.data?.message || "שגיאה ביצירת התיקייה");
    }
  } catch (error: any) {
    message.error(error.message || "שגיאה ביצירת התיקייה");
  } finally {
    setCreatingFolder(false);
  }
};

  const handleFolderClick = async (folderId: number) => {


     setEditingNote(null);
  setIsNewNote(false);
  setEditingReplyId(null);
  setIsAddingReply(false);

    setSelectedFolderId(folderId);
    setNotesLoading(true);
    setNotesError(null);
    try {
      const res = await GetNoteBookNotes(folderId);
      if (res?.data?.success) {
        setNotes(res.data.data);
      } else {
        setNotesError("לא נמצאו פתקים בתיקייה");
        setNotes([]);
      }
    } catch (error: any) {
      setNotesError(error.message || "שגיאה בשליפת פתקים");
      setNotes([]);
    } finally {
      setNotesLoading(false);
    }
  };



  const handleDeleteFolder = async (folderId: number) => {
  try {
    const res = await DeleteNoteBookFolder(folderId);
    if (res?.data?.success) {
      message.success("התיקייה נמחקה");

      // הסרה מהרשימה (in the query cache)
      queryClient.setQueryData(
        foldersKey,
        (old: { ok: boolean; folders: Folder[] } | undefined) =>
          old
            ? { ...old, folders: old.folders.filter((folder: Folder) => folder.id !== folderId) }
            : old
      );

    
      if (selectedFolderId === folderId) {
        setSelectedFolderId(null);
        setNotes([]);
        setEditingNote(null);
        setIsNewNote(false);
      }
    } else {
      message.error(res?.data?.message || "מחיקת התיקייה נכשלה");
    }
  } catch (error: any) {
    message.error(error.message || "שגיאה במחיקת התיקייה");
  }
};
const handleDeleteNote = async (noteId: number) => {
  try {
    const res = await DeleteNoteBookNote(noteId);

    if (res?.data?.success) {
      message.success("הפתק נמחק");

      // הסרה מהרשימה
      setNotes((prev) => prev.filter((note) => note.id !== noteId));

      // אם הפתק שנמחק היה פתוח בעורך – סוגרים אותו
      if (editingNote?.id === noteId) {
        setEditingNote(null);
        setIsNewNote(false);
      }
    } else {
      message.error(res?.data?.message || "מחיקת הפתק נכשלה");
    }
  } catch (error: any) {
    message.error(error.message || "שגיאה במחיקת הפתק");
  }
};



const isFolderOwnedByCurrentUser = (folder: Folder): boolean => {
  if (!folder.team_member_id) return false;

  const teamMember = teamMembers?.find(
    (tm: any) => tm.id === folder.team_member_id
  );

  return teamMember?.user_id === selectedPermission?.user_id;
};


   const { teamMembers } = useTeamMembers(
      selectedTeam?.id || null,
      Number(selectedCourseBatch?.id)
    );

    

    
 const renderFolderItem = (folder: Folder) => {
  const isSelected = selectedFolderId === folder.id;
  const itemClass = [styles.folderItem, isSelected ? styles.folderItemSelected : ""]
    .filter(Boolean)
    .join(" ");


    
  return (
    <div key={folder.id}>
      <div className={itemClass} onClick={() => handleFolderClick(folder.id)}>
        <span
          className={[
            styles.ellipse,
            isSelected ? styles.ellipseSelected : "",
          ]
            .filter(Boolean)
            .join(" ")}
        >
          <FolderOutlined
            className={[
              styles.ellipseIcon,
              isSelected ? styles.ellipseIconSelected : "",
            ]
              .filter(Boolean)
              .join(" ")}
          />
        </span>

        <span
          className={[
            styles.folderName,
            isSelected ? styles.folderNameSelected : "",
          ]
            .filter(Boolean)
            .join(" ")}
        >
          {folder.name}
        </span>


        {/* אייקון לתיקייה משותפת */}
        {folder.system_key == "system"&& (
          <Tooltip title="התקייה משותפת לכל הצוות- הפתקים חשופים לכל מי שבצוות ">
            <TeamOutlined className={styles.sharedFolderIcon} />
          </Tooltip>
        )}

        <div
          className={styles.deleteWrapper}
          onClick={(e) => e.stopPropagation()}
        >
          {(
            selectedPermission?.role_code === "SYSTEM-ADMIN" ||
            (!folder?.system_key && isFolderOwnedByCurrentUser(folder))
          ) && (
            <Popconfirm
              title="מחיקת תיקייה"
              description="התיקייה וכל הפתקים שבה יימחקו. להמשיך?"
              onConfirm={() => handleDeleteFolder(folder.id)}
              okText="מחק"
              cancelText="ביטול"
              okButtonProps={{ danger: true }}
            >
              <DeleteFilled className={styles.deleteIcon} />
            </Popconfirm>
          )}
        </div>
      </div>

      {folder.children?.length ? (
        <div className={styles.folderChildren}>
          {folder.children.map(renderFolderItem)}
        </div>
      ) : null}
    </div>
  );
};

  const findNoteById = (noteId: number, notesList: Note[] = notes): Note | null => {
  for (const note of notesList) {
    if (note.id === noteId) return note;
    const found = findNoteById(noteId, note.replies || []);
    if (found) return found;
  }
  return null;
};

  const refreshNotes = async () => {
  if (!selectedFolderId) return;

  try {
    const res = await GetNoteBookNotes(selectedFolderId);
    if (res?.data?.success) {
      const freshNotes: Note[] = res.data.data;
      setNotes(freshNotes);

      // אם יש פתק פתוח בעורך – ננסה למצוא אותו בעץ המעודכן
      if (editingNote) {
        const updatedEditingNote = findNoteById(editingNote.id, freshNotes);
        if (updatedEditingNote) {
          setEditingNote(updatedEditingNote);
        } else {
          // אם הפתק נמחק – נסגור את העורך
          setEditingNote(null);
          setIsNewNote(false);
        }
      }
    }
  } catch (error) {
    console.error("Failed to refresh notes:", error);
  }
};

  const selectedFolder = folders.find((f) => f.id === selectedFolderId);
      


  
  
  return (
    <aside className={styles.container}>
      <div className={styles.headerRow}>
        <HeaderPermissionDisplay />
      </div>

      <div className={styles.content}>
  
        <div className={styles.foldersPanel}>
          <Typography.Text strong className={styles.foldersTitle}>
            תיקיות
          </Typography.Text>
{
1 &&
   <Button
   type="text"
      icon={<PlusOutlined />}
      onClick={() => setIsFolderModalOpen(true)}
      className={styles.addFolderButton}
      />

    }
          {foldersLoading ? (
            <div className={styles.spinWrapper}>
              <Spin />
            </div>
          ) : foldersError ? (
            <Alert type="error" message={foldersError} showIcon />
          ) : folders.length === 0 ? (
            <Empty description="אין תיקיות" image={Empty.PRESENTED_IMAGE_SIMPLE} />
          ) : (
            <List
              size="small"
              dataSource={folders}
              renderItem={renderFolderItem}
              split={false}
            />
          )}
        </div>

      
        <div className={styles.notesPanel}>
                     
    
          {!selectedFolderId ? (
            <Empty
              description="בחר תיקייה כדי לראות את הפתקים"
              className={styles.emptyWrapper}
            />
          ) : notesLoading ? (
            <div className={styles.spinWrapperCenter}>
              <Spin />
            </div>
          ) : notesError ? (
            <Alert type="error" message={notesError} showIcon />
          ) : notes.length === 0 && !editingNote ? (
            <>
            <Empty description="אין פתקים בתיקייה" className={styles.emptyWrapper} />
          {

            <Button
    type="primary"
    icon={<PlusOutlined />}
    size="small"
       className={styles.newNoteButton}
    onClick={() => {
      setEditingNote({
        id: 0,
        title: "",
        content: null,
        parent_note_id: null,
        replies: [],
        created_by:1
        
      });
      setIsNewNote(true);
    }}
  >
    פתק חדש
  </Button>
          }
            </>
          ) : (
            <>
             <div className={styles.notesHeader}>
  <div className={styles.notesHeaderInfo}>
    <Typography.Title level={5} style={{ margin: 0 }}>
      {selectedFolder?.name ?? "פתקים"}
    </Typography.Title>
    <Typography.Text type="secondary" className={styles.notesCount}>
      ({notes.length})
    </Typography.Text>
  </div>

  <Button
    type="primary"
    icon={<PlusOutlined />}
    size="small"
       className={styles.newNoteButton}
    onClick={() => {
      setEditingNote({
        id: 0,
        title: "",
        content: null,
        parent_note_id: null,
        replies: [],
        created_by:selectedPermission?.user_id
      });
      setIsNewNote(true);
    }}
  >
    פתק חדש
  </Button>
</div>

<div className={styles.notesContainer}>
      


              <div className={styles.notesGrid}>
                {notes.map((note) => {
               
                  const lastUpdated = note.updated_at || note.updatedAt || note.created_at || note.createdAt;

                  return (
                    <Card
                      key={note.id}
  onClick={() => {
    setEditingNote(note);
    setIsNewNote(false);  
    setEditingReplyId(null);
  }}
                      hoverable
                      size="small"
                     className={`${styles.noteCard} ${
    editingNote?.id === note.id ? styles.noteCardSelected : ""
  }`}
                      styles={{ body: { padding: 0 } }}
                    >
                      <div className={styles.noteCardTopBar} />
                      <div className={styles.noteCardBody}>
                        <FileTextOutlined className={styles.noteCardIcon} />
                        <Typography.Text strong  className={styles.noteCardTitle}>
                          {note.title || "ללא כותרת"}
                        </Typography.Text>
                      </div>
                      {lastUpdated && (
                        <div className={styles.noteCardFooter}>
                          <ClockCircleOutlined className={styles.noteCardDateIcon} />
                          <Typography.Text type="secondary" className={styles.noteCardDate}>
                            {new Date(lastUpdated).toLocaleString("he-IL", {
                              day: "2-digit",
                              month: "2-digit",
                              year: "numeric",
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                          </Typography.Text>
      {
        note?.creator?.name && 
 <div className={styles.noteCardCreator}>
      <UserOutlined />
      <Typography.Text type="secondary" className={styles.noteCardCreatorName}>
                      {note?.creator?.name}
      </Typography.Text>
    </div>
    }
                             <div
        className={styles.noteCardDeleteWrapper}
        onClick={(e) => e.stopPropagation()}
      >
        <Popconfirm
          title="מחיקת פתק"
          description="הפתק וכל התגובות שלו יימחקו. להמשיך?"
          onConfirm={() => handleDeleteNote(note.id)}
          okText="מחק"
          cancelText="ביטול"
          okButtonProps={{ danger: true }}
        >
          <DeleteFilled className={styles.noteCardDeleteIcon} />
        </Popconfirm>
      </div>

                        </div>
                      )}
                    </Card>
                  );
                })}
              </div>
              
              {editingNote && (
                <div className={styles.noteEditorWrapper}>
                <NoteEditor
                  key={editingNote.id} 
                  folderName={selectedFolder?.name}
                  initialTitle={editingNote.title}
                  initialContent={editingNote.content} 
                  initialMode={isNewNote ? "edit" : "view"}
                  canEdit={selectedPermission?.role_code != "STUDENT" || editingNote.created_by === selectedPermission?.user_id}
                  creatorName={editingNote?.creator?.name}
                  onBack={() => {
                    setEditingNote(null);
                    setIsNewNote(false);
                  }}
            onSave={async (title, content) => {
  try {
    if (isNewNote) {
      const res = await CreateNoteBookNote({
        folder_id: selectedFolderId!,
        title,
        content,
        created_by:selectedPermission?.user_id
      });
      if (res?.data?.success) {
        await refreshNotes();
        setIsNewNote(false);
        message.success("פתק נוצר");
        return true;
      }
      return false;
    } else {
      const res = await UpdateNoteBookNote(editingNote.id, { title, content });
      if (res?.data?.success) {
        await refreshNotes();
        message.success("הפתק עודכן");
        return true;
      }
      return false;
    }
  } catch (e) {
    console.error(e);
    message.error("שמירה נכשלה");
    return false;
  }
}}
                />
               
 <div className={styles.threadPanel}>
{editingNote?.replies?.length > 0 && (
  <div className={styles.threadReplies}>
    {editingNote.replies.map((reply) => {
      const replyUpdated =
        reply.updated_at || reply.updatedAt || reply.created_at || reply.createdAt;

      const isReplyOpen = editingReplyId === reply.id;

      return (
        <div key={reply.id} className={styles.threadReplyItem}>
          {/* הכרטיסייה – לחיצה פותחת/סוגרת */}
          <div
            className={`${styles.threadReplyCard} ${
              isReplyOpen ? styles.threadReplyCardOpen : ""
            }`}
            onClick={() => {
              if (isReplyOpen) {
                setEditingReplyId(null); // סגירה
              } else {
                setEditingReplyId(reply.id); // פתיחה
              }
            }}
          >
            <div className={styles.threadReplyContent}>
              <FileTextOutlined className={styles.threadReplyIcon} />
              <Typography.Text strong className={styles.threadReplyTitle}>
                {reply.title || "ללא כותרת"}
              </Typography.Text>
            </div>

            {replyUpdated && (
              <div className={styles.threadReplyFooter}>
                <ClockCircleOutlined className={styles.threadReplyDateIcon} />
                <Typography.Text type="secondary" className={styles.threadReplyDate}>
                  {new Date(replyUpdated).toLocaleString("he-IL", {
                    day: "2-digit",
                    month: "2-digit",
                    year: "numeric",
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </Typography.Text>
              </div>
            )}
          </div>

          {/* אם פתוחה – מציגים עורך מתחת */}
          {isReplyOpen && (
            <div className={styles.threadReplyEditorWrapper}>
              <NoteEditor
                key={reply.id}
                folderName={selectedFolder?.name}
                initialTitle={reply.title}
                initialContent={reply.content}
          
                  initialMode={isNewNote ? "edit" : "view"}
                creatorName={reply?.creator?.name}
                canEdit={selectedPermission?.role_code === "SYSTEM-ADMIN" || reply.created_by === selectedPermission?.user_id}
                onBack={() => setEditingReplyId(null)}
         onSave={async (title, content) => {
  try {
    const res = await UpdateNoteBookNote(reply.id, { title, content });
    if (res?.data?.success) {
      await refreshNotes();
      setEditingReplyId(null);
      message.success("התגובה עודכנה");
      return true;
    }
    return false;
  } catch (e) {
    console.error(e);
    message.error("שמירה נכשלה");
    return false;
  }
}}
              />
            </div>
          )}
        </div>
      );
    })}
  </div>
)}
              {
editingNote && editingNote.id !== 0 &&
 <div className={styles.newReplySection}>
    {isAddingReply ? (
  <div className={styles.newReplyEditorContainer}>
   <div className={styles.newReplyEditorActions}>
      <Button
        icon={<CloseOutlined />}
        onClick={() => setIsAddingReply(false)}
        className={styles.cancelNewReplyButton}
      >
        ביטול הוספת תגובה
      </Button>
    </div>

    <NoteEditor
      key="new-reply"
      folderName={selectedFolder?.name}
      initialTitle=""
    initialMode={isNewNote ? "edit" : "view"}
      canEdit={true}
      initialContent={null}
      isAddingResponse={true}
      onBack={() => setIsAddingReply(false)}
   onSave={async (title, content) => {
  try {
    const res = await CreateNoteBookNote({
      folder_id: selectedFolderId!,
      title,
      content,
      parent_note_id: editingNote?.id ?? null,
      created_by:selectedPermission?.user_id
    });
    if (res?.data?.success) {
      await refreshNotes();
      setIsAddingReply(false);
      message.success("התגובה נוספה");
      return true;
    }
    return false;
  } catch (e) {
    console.error(e);
    message.error("שמירה נכשלה");
    return false;
  }
}}
    />
  </div>
) : (
  <Button
    type="dashed"
    icon={<PlusOutlined />}
    block
    onClick={() => {
      setIsAddingReply(true);
      setEditingReplyId(null); // סגירת עורך תגובה פתוח
    }}
  >
    הוסף תגובה חדשה
  </Button>
)}
  </div>
              }


  </div>

                </div>
              )}
</div>

            </>
          )}
        </div>

      </div>
<Modal
  title="יצירת תיקייה חדשה"
  open={isFolderModalOpen}
  onOk={handleCreateFolder}
  onCancel={() => {
    setIsFolderModalOpen(false);
    setNewFolderName("");
    setFolderScope("personal");
  }}
  okText="צור תיקייה"
  cancelText="ביטול"
  confirmLoading={creatingFolder}
  okButtonProps={{
    style: {
      background: "#611f69",
      borderColor: "#611f69",
      borderRadius: 8,
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
      <Alert
        type="success"
        showIcon
        message={<span>יוצרים תיקייה משותפת לכל הצוות</span>}
      />
    ) : (
      <Alert
        type="warning"
        showIcon
        message={<span>לא נבחר חייל – לא ניתן ליצור תיקייה אישית</span>}
      />
    )}
  </div>

  {/* רק אם המשתמש אינו STUDENT – בחירת קהל */}
  {selectedPermission?.role_code !== "STUDENT" && (
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
    placeholder="הזן שם לתיקייה..."
    value={newFolderName}
    onChange={(e) => setNewFolderName(e.target.value)}
    onPressEnter={handleCreateFolder}
    autoFocus
    size="large"
    prefix={<FolderOutlined style={{ color: "#bfbfbf" }} />}
  />
</Modal>
    </aside>
  );
};

export default Notebook;