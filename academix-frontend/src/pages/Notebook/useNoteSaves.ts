// Save handlers of the Notebook page: note (create / update), reply (update / create).
// They return false on failure; NoteEditor then shows the error toast (split out of Notebook.tsx, #125).
import { message } from "antd";
import { CreateNoteBookNote, UpdateNoteBookNote } from "../../services/ApiServices";
import { Note } from "./notebookTypes";

type Params = {
  editingNote: Note | null;
  isNewNote: boolean;
  setIsNewNote: (isNew: boolean) => void;
  selectedFolderId: number | null;
  currentUserId: number | undefined;
  refreshNotes: () => Promise<void>;
  setEditingReplyId: (id: number | null) => void;
  setIsAddingReply: (adding: boolean) => void;
};

export function useNoteSaves({
  editingNote,
  isNewNote,
  setIsNewNote,
  selectedFolderId,
  currentUserId,
  refreshNotes,
  setEditingReplyId,
  setIsAddingReply,
}: Params) {
  const saveNote = async (title: string, content: any): Promise<boolean> => {
    if (!editingNote) return false;
    try {
      if (isNewNote) {
        const res = await CreateNoteBookNote({
          folder_id: selectedFolderId!,
          title,
          content,
          created_by: currentUserId,
        });
        if (res?.data?.success) {
          await refreshNotes();
          setIsNewNote(false);
          message.success("פתק נוצר");
          return true;
        }
        return false;
      }
      const res = await UpdateNoteBookNote(editingNote.id, { title, content });
      if (res?.data?.success) {
        await refreshNotes();
        message.success("הפתק עודכן");
        return true;
      }
      return false;
    } catch (e) {
      console.error(e);
      return false;
    }
  };

  const saveReply = (reply: Note) => async (title: string, content: any) => {
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
      return false;
    }
  };

  const createReply = async (title: string, content: any) => {
    try {
      const res = await CreateNoteBookNote({
        folder_id: selectedFolderId!,
        title,
        content,
        parent_note_id: editingNote?.id ?? null,
        created_by: currentUserId,
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
      return false;
    }
  };

  return { saveNote, saveReply, createReply };
}
