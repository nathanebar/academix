// Types and pure helpers of the Notebook page (split out of Notebook.tsx, issue #125).

export interface Soldier {
  id: number;
  name: string;
  team_member_id: number;
}

export interface Folder {
  id: number;
  name: string;
  team_member_id?: number;
  team_course_batch_id?: number;
  children?: Folder[];
  system_key: string | null;
}

export interface Note {
  id: number;
  title: string;
  content?: any;
  parent_note_id: number | null;
  replies: Note[];
  creator?: any;
  created_by?: number;
  updated_at?: string | null;
  updatedAt?: string | null;
  created_at?: string | null;
  createdAt?: string | null;
}

export const toFolder = (folder: any): Folder => ({
  id: folder.id,
  name: folder.name,
  team_member_id: folder.team_member_id,
  team_course_batch_id: folder.team_course_batch_id,
  system_key: folder.system_key,
});

/** Depth-first search in the note tree (notes and their replies). */
export const findNoteById = (noteId: number, notesList: Note[]): Note | null => {
  for (const note of notesList) {
    if (note.id === noteId) return note;
    const found = findNoteById(noteId, note.replies || []);
    if (found) return found;
  }
  return null;
};

/** Last update date of a note or reply, whatever the API field name. */
export const noteLastUpdated = (note: Note) =>
  note.updated_at || note.updatedAt || note.created_at || note.createdAt;

export const formatNoteDate = (date: string) =>
  new Date(date).toLocaleString("he-IL", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

/** New (unsaved) note opened in the editor; id 0 means "not created yet". */
export const emptyNote = (createdBy: number | undefined): Note => ({
  id: 0,
  title: "",
  content: null,
  parent_note_id: null,
  replies: [],
  created_by: createdBy,
});
