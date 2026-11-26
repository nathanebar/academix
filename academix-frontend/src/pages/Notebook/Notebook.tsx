// Notebook page ("המחברת"): folders, notes and replies of the selected team / member.
// Split in issue #125: FolderList, NoteCard, NoteThread, CreateFolderModal, notebookTypes.
import React, { useEffect, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { notebookKeys } from "../../api/queryKeys";
import { Spin, Empty, Alert, Typography, message, Button } from "antd";
import { PlusOutlined } from "@ant-design/icons";

import styles from "./Notebook.module.css";
import {
  GetNoteBookFolders,
  GetNoteBookNotes,
  DeleteNoteBookFolder,
  CreateNoteBookFolder,
  DeleteNoteBookNote,
} from "../../services/ApiServices";
import { HeaderPermissionDisplay } from "../../components/HeaderPermissionDisplay";
import { useSelectionsStore } from "../../store/selectionStore";
import NoteEditor from "./NoteEditor/NoteEditor";
import { usePermissionStore } from "../../store/permissionStore";
import { useTeamMembers } from "../../hooks/useTeamMembers";
import { emptyNote, findNoteById, Folder, Note, Soldier, toFolder } from "./notebookTypes";
import FolderList from "./FolderList";
import NoteCard from "./NoteCard";
import NoteThread from "./NoteThread";
import CreateFolderModal, { FolderScope } from "./CreateFolderModal";
import { useNoteSaves } from "./useNoteSaves";

const Notebook: React.FC = () => {
  const [selectedSoldier] = useState<Soldier | null>(null);
  const [selectedFolderId, setSelectedFolderId] = useState<number | null>(null);

  const [notes, setNotes] = useState<Note[]>([]);
  const [notesLoading, setNotesLoading] = useState(false);
  const [notesError, setNotesError] = useState<string | null>(null);
  const [editingNote, setEditingNote] = useState<Note | null>(null);
  const [isNewNote, setIsNewNote] = useState(false);

  const { selectedCourseBatch, selectedTeam, selectedTeamMember, activeHeaderType } =
    useSelectionsStore();
  const { selectedPermission } = usePermissionStore();
  const isStudent = selectedPermission?.role_code === "STUDENT";
  const currentUserId = selectedPermission?.user_id;

  const [isFolderModalOpen, setIsFolderModalOpen] = useState(false);
  const [newFolderName, setNewFolderName] = useState("");
  const [creatingFolder, setCreatingFolder] = useState(false);
  const [editingReplyId, setEditingReplyId] = useState<number | null>(null);
  const [isAddingReply, setIsAddingReply] = useState(false);
  const [folderScope, setFolderScope] = useState<FolderScope>("personal");

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
  const foldersError: string | null = foldersQuery.isError
    ? (foldersQuery.error as any)?.message || "שגיאה בשליפת תיקיות"
    : foldersQuery.data && !foldersQuery.data.ok
    ? activeHeaderType !== "teamMember"
      ? "יש לבחור חבר צוות"
      : "לא נמצאו תיקיות לחייל זה"
    : null;

  const { teamMembers } = useTeamMembers(
    selectedTeam?.id || null,
    Number(selectedCourseBatch?.id)
  );

  // Scope change: reset the selection (UI state; the folders come from the query above)
  useEffect(() => {
    setNotes([]);
    setSelectedFolderId(null);
    setEditingNote(null);
    setIsNewNote(false);
    setNotesError(null);
  }, [selectedSoldier, selectedTeamMember?.id, selectedTeam?.id, selectedCourseBatch?.id]);

  const closeFolderModal = () => {
    setIsFolderModalOpen(false);
    setNewFolderName("");
    setFolderScope("personal");
  };

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
        closeFolderModal();
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
    const teamMember = teamMembers?.find((tm: any) => tm.id === folder.team_member_id);
    return teamMember?.user_id === currentUserId;
  };

  const canDeleteFolder = (folder: Folder) =>
    selectedPermission?.role_code === "SYSTEM-ADMIN" ||
    (!folder?.system_key && isFolderOwnedByCurrentUser(folder));

  // Same rule as editing a note: staff, or the student who wrote it.
  const canEditNote = (note: Note) => !isStudent || note.created_by === currentUserId;

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

  const { saveNote, saveReply, createReply } = useNoteSaves({
    editingNote,
    isNewNote,
    setIsNewNote,
    selectedFolderId,
    currentUserId,
    refreshNotes,
    setEditingReplyId,
    setIsAddingReply,
  });

  const startNewNote = () => {
    setEditingNote(emptyNote(currentUserId));
    setIsNewNote(true);
  };

  const newNoteButton = (
    <Button
      type="primary"
      icon={<PlusOutlined />}
      size="small"
      className={styles.newNoteButton}
      onClick={startNewNote}
    >
      פתק חדש
    </Button>
  );

  const selectedFolder = folders.find((f) => f.id === selectedFolderId);

  return (
    <aside className={styles.container}>
      <div className={styles.headerRow}>
        <HeaderPermissionDisplay />
      </div>

      <div className={styles.content}>
        <FolderList
          folders={folders}
          loading={foldersQuery.isLoading}
          error={foldersError}
          selectedFolderId={selectedFolderId}
          canDeleteFolder={canDeleteFolder}
          onAddFolder={() => setIsFolderModalOpen(true)}
          onFolderClick={handleFolderClick}
          onDeleteFolder={handleDeleteFolder}
        />

        <div className={styles.notesPanel}>
          {!selectedFolderId ? (
            <Empty description="בחר תיקייה כדי לראות את הפתקים" className={styles.emptyWrapper} />
          ) : notesLoading ? (
            <div className={styles.spinWrapperCenter}>
              <Spin />
            </div>
          ) : notesError ? (
            <Alert type="error" message={notesError} showIcon />
          ) : notes.length === 0 && !editingNote ? (
            <>
              <Empty description="אין פתקים בתיקייה" className={styles.emptyWrapper} />
              {newNoteButton}
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
                {newNoteButton}
              </div>

              <div className={styles.notesContainer}>
                <div className={styles.notesGrid}>
                  {notes.map((note) => (
                    <NoteCard
                      key={note.id}
                      note={note}
                      selected={editingNote?.id === note.id}
                      canDelete={canEditNote(note)}
                      onOpen={() => {
                        setEditingNote(note);
                        setIsNewNote(false);
                        setEditingReplyId(null);
                      }}
                      onDelete={() => handleDeleteNote(note.id)}
                    />
                  ))}
                </div>

                {editingNote && (
                  <div className={styles.noteEditorWrapper}>
                    <NoteEditor
                      key={editingNote.id}
                      folderName={selectedFolder?.name}
                      initialTitle={editingNote.title}
                      initialContent={editingNote.content}
                      initialMode={isNewNote ? "edit" : "view"}
                      canEdit={canEditNote(editingNote)}
                      creatorName={editingNote?.creator?.name}
                      onBack={() => {
                        setEditingNote(null);
                        setIsNewNote(false);
                      }}
                      onSave={saveNote}
                    />

                    <NoteThread
                      note={editingNote}
                      folderName={selectedFolder?.name}
                      isNewNote={isNewNote}
                      editingReplyId={editingReplyId}
                      setEditingReplyId={setEditingReplyId}
                      isAddingReply={isAddingReply}
                      setIsAddingReply={setIsAddingReply}
                      canEditReply={(reply) =>
                        selectedPermission?.role_code === "SYSTEM-ADMIN" ||
                        reply.created_by === currentUserId
                      }
                      onSaveReply={saveReply}
                      onCreateReply={createReply}
                    />
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      </div>

      <CreateFolderModal
        open={isFolderModalOpen}
        creating={creatingFolder}
        folderScope={folderScope}
        setFolderScope={setFolderScope}
        name={newFolderName}
        setName={setNewFolderName}
        showScopeChoice={!isStudent}
        selectedTeamMember={selectedTeamMember}
        onCreate={handleCreateFolder}
        onCancel={closeFolderModal}
      />
    </aside>
  );
};

export default Notebook;
