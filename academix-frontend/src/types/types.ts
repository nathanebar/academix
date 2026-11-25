import { Task } from "../store/taskStore";

export type MemberRole = "OVERLAP" | "TEAM_COMMANDER";
export interface AssignedUser {
  team_member_id?: number | null;
  member_id: number | null;
  user_id: number | null;
  user_name: string | null;
  member_role: string | null;
}
export interface HoefTaskItem {
  [x: string]: unknown;
  id: number | null;
  task_assignment_id: number;
  task_id: number;
  task_name: string;
  task_color: string;
  deadline: string | null;
  completed: boolean;
  completed_at?: string | null;
  daysUntilDeadline: number | null;
  status: string;
  assignedTo: AssignedUser;
  hoef_count?: number | string;
  notRequiredToCheck?: boolean;
  feedback?: any;
  axis?: any;
  taskGroup?: any;
  hoefs?: any;
  task_feedback?: any;
  taskRecommendedTime?: any;
  task_recommended_time?: any;
}
export interface MemberData {
  id: number | null;
  hoef_member_id: number;
  hoef_user_id: number;
  name: string;
  userName?: string;
  member_role: MemberRole;
  tasks: HoefTaskItem[];
  stats: {
    total: number;
    overdue: number;
    upcoming: number;
    noDeadline: number;
    completed: number;
    completionRate: number;
  };
}
export interface HoefData extends MemberData {}
export interface TaskItem {
  id: number;
  task_assignment_id: number;
  task_id: number;
  task_name: string;
  task_color: string;
  task_start: string | null;
  task_end: string | null;
  task_completed: boolean;
  task_feedback: number | null;
  task_completed_at: string | null;
  hoef_count: number;
  has_hoefs: boolean;

  hoefs: Array<{
    member_id: number;
    user_id: number;
    user_name: string;
  }>;

  taskGroup?: {
    id: number;
    name: string;
    status: string;
  };

  axis?: {
    id: number;
    name: string;
    color: string;
    repository_kind: string;
  };
  assignedTo: AssignedUser;
  taskRecommendedTime?: boolean;
  feedback: any;
  notRequiredToCheck?: boolean;
}
export interface TaskGroupData {
  id?: number;
  axisId: number | undefined;
  name: string;
  team_id: string | null;
  created_at: string;
  updated_at: string;
}
export interface TaskTypeData {}
export interface User {
  id: number;
  name: string;
  militaryid: string;
  username: string;
  password: string;
  createdAt: Date;
  updatedAt: Date;
  basicCourse?: string | null;
}
export interface Domain {
  id: string | number;
  name: string;
}
export interface Course {
  id: string | number;
  name: string;
  domainId: string | number;
  duration_months: number;
  description: string;
  location: string;
  targets: string;
  requirements: string;
}
export interface CourseBatch {
  id: string | number;
  name: string;
  courseId: string | number;
  start_date: Date;
  status: string;
}
export interface Team {
  id: number;
  name: string;
  course_batch_id: string | number;
}
export interface FilteredDataResult {
  filteredDomains: Domain[];
  filteredTeams: Team[];
  filteredCourses: Course[];
  filteredBatches: CourseBatch[];
  filteredAxes: Axis[];
  filteredTeamMembers: TeamMembers[];
}
// Moved to src/theme/taskColors.ts (#100); re-exported here so existing imports keep working.
import { gradientColors } from "../theme/taskColors";
export { gradientColors };
export const colors: SchemaName[] = [
  "coral",
  "lightPink",
  "pink",
  "lightPurple",
  "purple",
  "green",
  "lightGreen",
  "lightBlue",
  "skull",
  "lightSkull",
  "lightCoral",
  "orange",
  "lightOrange",
  "yellow",
  "gray",
  "lightGray",
  "purpleBlue",
  "deepPurpleBlue",
  "brown",
  "black",
];
export const schemaMap: Record<SchemaName | any, Gradient> = gradientColors;
export type Gradient = { from: string; to: string };
export type SchemaName =
  | "coral"
  | "lightPink"
  | "pink"
  | "lightPurple"
  | "purple"
  | "green"
  | "lightGreen"
  | "lightBlue"
  | "skull"
  | "lightSkull"
  | "lightCoral"
  | "orange"
  | "lightOrange"
  | "yellow"
  | "gray"
  | "lightGray"
  | "purpleBlue"
  | "deepPurpleBlue"
  | "brown"
  | "black"
  | "null";
export interface Axis {
  id?: number;
  name: string;
  courseId: number;
  team_id: number | null;
  color: SchemaName;
  repository_kind: string;
  updatedAt?: Date;
}
// src/types/types.ts
export interface AxisTemplate {
  axisId: number;
  /** אפשרויות (ה‑column names זהים ל‑DB) */
  files: boolean; // צירוף קבצים
  link: boolean; // קישור
  checklist: boolean; // צ׳ק‑ליסט
  gradeStage: boolean; // שלב בהסמכה  (gradeStage בטבלה)
  duration: boolean; // משך זמן
  feedBack: boolean; // משוב          (feedBack בטבלה)
  Form: boolean; // טופס          (Form בטבלה – אות ראשית גדולה)
  FileResponse: boolean; // תגובת קובץ   (FileResponse בטבלה)
  SolutionFile: boolean; // קובץ פתרון   (SolutionFile בטבלה)
  color: boolean; // תגובת קובץ   (FileResponse בטבלה)
  tags: boolean; // קובץ פתרון   (SolutionFile בטבלה)
  exposureEnabled: boolean;
  /** timestamps – רק לקריאה */
  createdAt?: string;
  updatedAt?: string;
}
export interface TeamMembers {
  id: number;
  team_id: number;
  user_id: number;
  member_role: string;
  Team?: any;
  User?: any;
  name?: string | undefined;
  delete_reason?: null | string;
  basicCourse?: string | null;
  course_batch_id?: string | number | undefined;
}
export type viewMode =
  | "dayGridMonth"
  | "timeGridWeek"
  | "timeGridDay"
  | "twoWeeks";
export interface Permission {
  id: number;
  role_code: string;
  scope_type: string;
  scope_id: number | null;
  scope_name?: string;
  scopeName?: string;
  course: any;
  allowedTeamIds: any;
  allowedCourseIds: any;
  allowedDomainIds: any;
  allowedCourseBatcheIds: any;
  allowedAxisIds: any;
}
export interface PermissionState {
  permissions: Assignment[];
  setPermissions: (permissions: Assignment[]) => void;
  selectedPermission: Partial<Assignment> | null;
  setSelectedPermission: (permission: Partial<Assignment> | null) => void;
  developerScope: DeveloperScope | null;
  fetchPermissions: (userId: number) => Promise<void>;
  loading: boolean;
  error: string | null;
  clearSelectedPermission: () => void;
  addPermission: (permission: Assignment) => void;
  removePermission: (permissionId: number) => void;
  isInitialized: boolean;
  setIsInitialized: (value: boolean) => void;
  selectedPermissionId?: any;
}
export interface Extendable<T> {
  value: T;
  name: string;
}
export interface Form {
  id?: number;
  courseId: number;
  teamId?: number;
  title: string;
  description: string;
  type: "test" | "survey";
  creator: number;
  is_active: boolean;
  show_score_per_question: boolean;
}
export interface QuestionType {
  id?: number | string;
  text: string;
  type:
    | "scale"
    | "text"
    | "description"
    | "multipleQuestion"
    | "american"
    | "fill_in_bank"
    | "fill_in_open"
    | "ordering_words"
    | "ordering_line"
    | "true_false"
    | "matching_pairs"
    | "file_upload";
  required: boolean;
  points?: number | null;
  fields?: Array<{
    id: number;
    text: string;
    type: "changeable" | "not-changeable"; // 'word' for fixed text, 'changeable' for editable
    isEditable?: boolean;
  }>;
  setFields?: any;
  max?: { title: string; value: number };
  min?: { title: string; value: number };
  options?: Array<string>;
  correctedOptions?: Array<boolean>;
  matches?: { value1: string; value2: string }[];
  booleanValue?: boolean;
  existingFiles?: any;
  uploadedFiles?: any;
}
export interface Question {
  matches?: any;
  id?: number | string;
  text: string;
  type:
    | "scale"
    | "text"
    | "description"
    | "multipleQuestion"
    | "american"
    | "fill_in_bank"
    | "fill_in_open"
    | "ordering_words"
    | "ordering_line"
    | "true_false"
    | "matching_pairs"
    | "file_upload";
  required: boolean;
  points?: number | null;
}
export interface OptionQuestion extends Question {
  options: Array<string>;
  correctedOptions?: Array<boolean>;
}
export interface fillInQuestion extends Question {
  fields: Array<{
    id: number;
    text: string;
    type: "changeable" | "not-changeable";
    isEditable?: boolean;
  }>;
}
export interface ScaleQuestionType extends Question {
  max: { title: string; value: number };
  min: { title: string; value: number };
}
export interface BooleanQuestion extends Question {
  booleanValue: boolean;
}
export interface Matching_pairs extends Question {
  matches: { value1: string; value2: string };
}
export type formType = {
  id?: number;
  formId: number;
  formTitle: string;
  formDesc: string;
  formStartDate: Date;
  score: number | null;
  started_at: Date | null;
  completed_at: string | null;
  submissionStatus: string | null;
  scorePercentage: number | null;
};
export type feedbackType = {
  axis: { name: string; color: string };
  reviewerName?: string;
  feedbackId: number;
  taskId: number;
  answers: {
    summary_grade: number;
    text_comment: string;
    taskId: number;
    member: { task_id: number; user_id: number; id: number };
    memberName?: string | null;
    taskName?: string | null;
    feedbackAnswerIsViewable?: boolean;
  }[];
  categoryComment: string;
  is_active: boolean;
  categories: {
    categoryName: string;
    counts: {
      improvement: number | null;
      preservation: number | null;
    };
  }[];
  feedbackCreatedAt: string;
  formStartDate: string;
  start?: string;
  feedbackName: string;
  feedbackSelectOptionScore?: number;
  taskName?: string;
  taskAssignmentId?: number;
  taskAssignmentsStart?: string;
  teamId?: string;
  seenGrade: boolean;
  questions?: {
    question_text: string;
  }[];
  taskCompleted_at?: string | null;
  taskCompleted?: string | null;
};
export type QuestionsTypes =
  | "scale"
  | "text"
  | "description"
  | "multipleQuestion"
  | "american"
  | "fill_in_bank"
  | "fill_in_open"
  | "ordering_words"
  | "ordering_line"
  | "true_false"
  | "matching_pairs"
  | "file_upload";
export interface QuestionProps {
  question: string;
  required?: boolean;
  points?: number;
  renderFor: "show" | "answer" | "grading";
  options?: any;
  submission: any;
  setFormData?: any;
  formData?: any;
  questionId?: string | number;
  answer?: any;
}
type ItemInsideGroup = {
  id: number | string;
  taskAssignmentId: number | string;
  occurrence_id: number | string | null;
  source: "assignment" | "occurrence";
};
export interface GroupedTask {
  is_scheduled: any;
  start_minutes_before: any;
  end_minutes_after: any;
  hidden: any;
  [key: string]: any;
  id: string;
  task_id: number | string;
  name: string;
  gn: string;
  color: string;
  tcolor?: string;
  start: string;
  end: string;
  items: ItemInsideGroup[];
  assignedCount: string;
  totalMembers: string;
  completionRate: string;
  creatorUsername: string;
  creatorName: string;
  status: string;
  taskassignmentid: string;
  recommendedTime: string;
  isLocked?: boolean;
  hasExposure?: boolean;
}
export interface FlatTask {
  [key: string]: any;
  is_scheduled: any;
  start_minutes_before: any;
  end_minutes_after: any;
  hidden: any;
  id: number | string;
  taskassignmentid?: string;
  task_id?: number | string;
  name: string;
  gn: string;
  color: string;
  tcolor?: string;
  most_frequent_assigned_at_start: string;
  most_frequent_assigned_at_end: string;
  source: "assignment" | "occurrence";
  status: "operational" | "assignment_bank" | "archives";
  creatorUsername: string;
  creatorName: string;
  completed: any;
  completed_at: any;
  recommendedTime: string;
  isLocked?: boolean;
  hasExposure?: boolean;
}
export type ROLE_CODE =
  | "COURSE_COMMANDER"
  | "DEVELOPER"
  | "DOMAIN_MANAGER"
  | "OVERLAP"
  | "STUDENT"
  | "SYSTEM-ADMIN"
  | "TEAM_COMMANDER"
  | "";
export interface Assignment {
  [x: string]: any;
  id: number;
  user_id: number;
  scope_type: "system" | "domain" | "course" | "team";
  scope_id: number;
  scopeName: string;
  role_code: ROLE_CODE;
  role_name: string;
  allowedTeamIds: number[];
  allowedCourseIds: number[];
  allowedCourseBatcheIds: number[];
  allowedAxisIds: number[];
  allowedDomainIds: number[];
  completed_at?: any;
  completed?: any;
}
export interface DeveloperScope {
  systemIds: number[];
  allowedTeamIds: number[];
  [key: string]: any;
}
export type ValidationRule = {
  field: any;
  message: string;
  customCheck?: (task: Task) => boolean;
};
export const rules: ValidationRule[] = [
  {
    field: "name",
    message: "שם המשימה נדרש",
    customCheck: (t) => !!t.name?.trim(),
  },
  {
    field: "description",
    message: "תיאור המשימה נדרש",
    customCheck: (t) => !!t.description?.trim(),
  },
  {
    field: "files",
    message: "נדרש להוסיף קובץ",
    customCheck: (t) => {
      if (!t.filesPathes) return false;
      if (Array.isArray(t.filesPathes)) return t.filesPathes.length > 0;
      return false;
    },
  },
  {
    field: "link",
    message: "נדרש להוסיף קישור",
    customCheck: (t) => !!t.linkUrl,
  },
  {
    field: "gradeStage",
    message: "נדרש להוסיף שלב הסמכה",
    customCheck: (t) => !!t.gradeStageId,
  },
  {
    field: "duration",
    message: "נדרש להוסיף משך זמן",
    customCheck: (t) => t.recommendedTime != null,
  },
  {
    field: "feedBack",
    message: "נדרש להוסיף משוב",
    customCheck: (t) => !!t.feedbackId,
  },
  {
    field: "Form",
    message: "נדרש להוסיף שאלון",
    customCheck: (t) => !!t.formId,
  },
  {
    field: "checklist",
    message: "נדרש להוסיף שדות לצ׳ק‑ליסט",
    customCheck: (t) => {
      // 1️⃣ אם הערך אינו קיים – לא תקין
      if (!t.checkList) return false;
      // 2️⃣ אם הוא **מערך** – חייב להיות לפחות פריט אחד
      if (Array.isArray(t.checkList)) {
        return t.checkList.length > 0;
      }
      // 3️⃣ אם אינו מערך (אפשר להוסיף תנאי נוסף לפי מודל שלכם)
      // כאן נניח שכל ערך קיים (למשל אובייקט) הוא תקין
      return true;
    },
  },
  {
    field: "color",
    message: "נדרש לבחור צבע",
    customCheck: (t) => !!t.color,
  },
  {
    field: "tags",
    message: "נדרש להוסיף תיוגים",
    customCheck: (t) => {
      if (!t.tags) return false;
      if (Array.isArray(t.tags)) return t.tags.length > 0;
      return false;
    },
  },
];
export type Role = {
  code: string;
  name_he: string;
  name_en: string;
};
export interface TeamCourseBatchLink {
  id: number;
  team_id: number;
  course_batch_id: number;
}
export interface TeamWithBatches extends Team {
  courseBatches?: TeamCourseBatchLink[];
}
export interface TeamEvent {
  id: number;
  teamCourseBatchId: number;
  color: string;
  constant: boolean;
  title: string;
  recommendedTime: number;
  startDate: string;
  endDate: string;
  startHour: number | any;
  endHour: number | any;
  days: number[];
}
export interface TeamEventAssignment {
  id: number;
  TeamEventId: number;
  teamMemberId?: number | null;
  start: Date;
  end: Date;
  note?: string;
}

export interface BlockColorResponse {
  isBlockColorEnabled: boolean;
}
export interface BlockColorUpdateParams {
  teamId: string;
  courseBatchId: string;
  isBlockColorDto: boolean;
}

// ==========================================
// 🔥 Query Builder Types
// ==========================================

export type QueryField = "search" | "color" | "tag" | "gradeStage";

export type QueryOperator = "contains" | "equals" | "in";

export type Condition = {
  id: string;
  field: QueryField;
  operator: QueryOperator;
  value: string | number[] | string[];
};

export type QueryGroup = {
  id: string;
  logic: "AND" | "OR";
  conditions: Condition[];
  groups: QueryGroup[];
};

// ==========================================
// 🔥 Field Options (constants)
// ==========================================

export const FIELD_OPTIONS: Record<QueryField, { label: string }> = {
  search: { label: "טקסט" },
  color: { label: "צבע" },
  tag: { label: "תגית" },
  gradeStage: { label: "שלב הסמכה" },
};

export const OPERATOR_OPTIONS: Record<
  QueryField,
  { value: QueryOperator; label: string }[]
> = {
  search: [
    { value: "contains", label: "מכיל" },
    { value: "equals", label: "שווה ל" },
  ],
  color: [
    { value: "in", label: "אחד מ" },
    { value: "equals", label: "שווה ל" },
  ],
  tag: [
    { value: "in", label: "אחד מ" },
    { value: "equals", label: "שווה ל" },
  ],
  gradeStage: [
    { value: "in", label: "אחד מ" },
    { value: "equals", label: "שווה ל" },
  ],
};
export interface QueueTask {
  assignedByName: null;
  task_id: number;
  name: string;
  status: string;
  exposure: boolean;
  recommendedTime: string | null;
  notRequiredToSubmit: boolean;
  notRequiredToCheck?: boolean;  
  task_color: string | null;
  formId: number | null;
  feedbackId: number | null;
  surveyId: number | null;
  group_name: string | null;
  group_id: number | null;
  axis_color: string | null;
  assignments_count: number;
  assignments: Assignment[];
  timeAgo: string;
  hasExposure: boolean;
  isQueueTask?: boolean;
  // ✅ שדות חדשים
  creatorName?: string | null;
  creatorUsername?: string | null;
  is_scheduled?: boolean;
  start_minutes_before?: number;
  end_minutes_after?: number;
  most_frequent_assigned_at_start?: string | null;
  most_frequent_assigned_at_end?: string | null;
  task_status?: string;

  // ✅ נתוני Form
  max_score?: number | null;
  scorePercentage?: number | null;
  form_score?: number | null;
  form_completed_at?: string | null;
  form_started_at?: string | null;
}

export interface QueueTasksResponse {
  success: boolean;
  data: QueueTask[];
}

export interface TaskEventExtendedProps {
  taskId: number;
  taskName: string;
  taskColor: string;
  axisColor: string;
  totalMembers: number;
  assignedCount: number;
  completed: number;
  completed_at: string | null;
  taskassignmentid: number;
  status: string;
  taskDescription?: string;
  creatorName?: string;
  isLocked?: boolean;
  isScheduled?: boolean;
  start_minutes_before?: number;
  end_minutes_after?: number;
  source?: string;
  minuts?: number;
  notRequiredToSubmit?: boolean;
  notRequiredToCheck?: boolean;
}

export interface TaskAssignmentTag {
  id: string | number;
  name: string;
  totalmembers: number | null;
  assignedcount: number;
  completed: number | null;
  completed_at: string | null;
  task_assignment_id: number | null;
  task_id: number | null;
}

export type ModalAction = "expand" | "new" | null;

export interface ActionOption {
  action: ModalAction;
  title: string;
  subtitle: string;
  iconBg: string;
  iconColor: string;
}

export interface CalendarEvent {
  id: string;
  title: string;
  start: Date;
  end?: Date;
  allDay?: boolean;
  backgroundColor?: string;
  extendedProps?: {
    isQueueTask?: boolean;
    endStr?: number;
    [key: string]: any;
  };
}

export const QUERIES_TO_INVALIDATE = [
  "group-tasks",
  "task-users",
  "assignments-completed-by-team",
  "tasks-range",
  "tasks-team-day",
  "tasksByColor",
  "tasksByTag",
  "tasksByGradeStage",
  "surveyDashboard",
];
