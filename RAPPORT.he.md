<div dir="rtl">

# Academix – דוח סקירה מלא של הפרויקט

> תאריך: 22.11.2026 · מצב: סקירה בלבד, **לא בוצע שום תיקון בקוד**.
> הדוח מתאר את המצב הנוכחי של ה-repository (commit `3d53584`), מציין בעיות שנמצאו ומציע שיפורי ביצועים ל-Frontend ול-Backend.

---

## תוכן עניינים
1. [תקציר מנהלים](#1-תקציר-מנהלים)
2. [מה המערכת עושה](#2-מה-המערכת-עושה)
3. [ארכיטקטורה ומחסנית טכנולוגית](#3-ארכיטקטורה-ומחסנית-טכנולוגית)
4. [מודל הנתונים](#4-מודל-הנתונים)
5. [Backend – סקירה מפורטת](#5-backend--סקירה-מפורטת)
6. [Frontend – סקירה מפורטת](#6-frontend--סקירה-מפורטת)
7. [אבטחה](#7-אבטחה)
8. [איכות קוד ותחזוקה](#8-איכות-קוד-ותחזוקה)
9. [שיפורי ביצועים – Backend](#9-שיפורי-ביצועים--backend)
10. [שיפורי ביצועים – Frontend](#10-שיפורי-ביצועים--frontend)
11. [תוכנית עבודה מומלצת לפי סדר עדיפויות](#11-תוכנית-עבודה-מומלצת-לפי-סדר-עדיפויות)

---

## 1. תקציר מנהלים

Academix היא מערכת לניהול הכשרות וקורסים (בסגנון Moodle), בעברית ובכיוון RTL, שנבנתה לרשת סגורה (אימות NTLM / Active Directory). המערכת מנהלת היררכיה ארגונית (מערכת ← תחום ← קורס ← מחזור ← צוות ← חניך), תוכן לימודי (צירים ← קבוצות משימות ← משימות), שיבוץ משימות ללוח שנה, טפסים ומבחנים, משובים, חפיפות (Hofef), מחברת אישית וקבצים.

| מדד | ערך |
|---|---|
| Backend | Node.js, Express 5, Sequelize 6, PostgreSQL, S3/MinIO. כ-28,000 שורות JS |
| Frontend | React 18, TypeScript 4.9, Create React App, Ant Design 5. כ-74,000 שורות TS/TSX ועוד כ-24,000 שורות CSS |
| מודלים | 48 |
| Controllers / קבצי Routes | 39 / 41 (כ-280 endpoints) |
| מיגרציות | 50 (לא עקביות, לא בשימוש בפועל) |
| קומפוננטות TSX | 253 |
| Stores (Zustand) / Hooks | 22 / 72 |
| בדיקות אוטומטיות | **אין** (רק `setupTests.ts` ריק) |

**הממצאים העיקריים:**
- **אבטחה:** ההרשאות נאכפות בעיקר בצד הלקוח. ה-Frontend שולח ל-API את רשימות המזהים המותרים (`allowedAxesIds`, `allowedCoursesIds` וכו') ואת זהות המשתמש בכותרות `X-User-Id` / `X-User-Name`, והשרת סומך עליהן. בלי `REQUIRE_AUTH=true` אין אימות בכלל.
- **ביצועים ב-Backend:** אין אינדקסים על מפתחות זרים, יש הרבה שאילתות N+1 (await בתוך לולאות), חישוב ההרשאות מריץ עשרות שאילתות ברצף, אין pagination, הלוגר כותב לקבצים בצורה סינכרונית, וקבצים נטענים במלואם לזיכרון בהעלאה.
- **ביצועים ב-Frontend:** אין code splitting (כל הדפים בחבילה אחת), יש ספריות כפולות (3 ספריות תאריכים, 2 ספריות לוח שנה, 2–4 ספריות גרפים), שני לקוחות HTTP במקביל, Loader גלובלי שחוסם את המסך בכל בקשה, וקומפוננטות ענק (עד 2,287 שורות).
- **תחזוקה:** קבצי controller של יותר מ-3,000 שורות, `any` בכ-1,190 מקומות, כ-200 `console.log`, אין בדיקות, ומיגרציות שבורות.

---

## 2. מה המערכת עושה

### 2.1 היררכיה ארגונית
```
System (מערכת)
 └─ Domain (תחום)
     └─ Course (קורס)
         ├─ CourseBatch (מחזור)  ←→  Team (צוות)   [דרך TeamCourseBatch]
         │                             └─ TeamMember (חניך / מפקד צוות / חופף)
         ├─ Axis (ציר לימוד)
         │    └─ TaskGroup (קבוצת משימות)
         │         └─ Task (משימה)
         │              └─ TaskAssignment (שיבוץ משימה לחניך/צוות)
         ├─ GradeStage (שלב הסמכה)
         ├─ Tag (תגית)
         ├─ Form (טופס / מבחן / סקר)
         └─ Feedback (משוב)
```

### 2.2 תפקידים (`models/role.js`, `RoleAssignment`)
`SYSTEM-ADMIN`, `DEVELOPER`, `DOMAIN_MANAGER`, `COURSE_COMMANDER`, `TEAM_COMMANDER`, `OVERLAP` (חופף), `STUDENT`.
לכל `RoleAssignment` יש `scope_type` (`system` / `domain` / `course` / `team` / `admin`) ו-`scope_id`. המשתמש בוחר ב-Frontend "הרשאה פעילה" (`selectedPermission`), וממנה נגזר כל מה שהוא רואה.
טריגרים ב-PostgreSQL (`migrations/20251009102719-create-role-assignment-triggers.js`) מוחקים שיבוצי תפקידים כשנמחקים קורס, תחום, צוות או חבר צוות.

### 2.3 מודולים פונקציונליים
| מודול | תיאור | קבצים עיקריים |
|---|---|---|
| ניהול ארגוני | יצירת מערכות, תחומים, קורסים, מחזורים, צוותים ושיבוץ חניכים | `DevDashboard`, `DomainDashboard`, `CourseDashboard`, `courseBatchDashboard`, `StudentsTeamManager` |
| תוכן לימודי | צירים, קבוצות משימות, משימות (קבצים, צ'קליסטים, תגיות, שלבי הסמכה, צבע, זמן מומלץ, טופס/משוב מקושר), תבניות צירים, סטטוס לפי מחזור (`operational` / `assignment_bank` / `archives`) | `AxisBoard`, `TaskGroup`, `Task`, `NewTaskModal`, `CourseContent`, `task.controller.js` |
| לוח שנה ושיבוץ | שיבוץ משימות לצוות/חניך על לוח שנה (FullCalendar), מופעים חוזרים (`TaskAssignmentOccurrence`), ימים חסומים, אירועי צוות (`TeamEvent`, `TeamEventDay`, `TeamEventAssignment`), סדר צירים לצוות | `pages/calendar/Calendar.tsx`, `DayCalendar.tsx`, `taskAssignment.controller.js` |
| תור משימות | תור המשימות הבאות של חניך/צוות | `TasksQueuePanel`, `queue.controller.js` |
| מעקב התקדמות | סימון השלמה (טופס, קישור, צ'קליסט, קובץ, קובץ תגובה) על ידי החניך או המפקד | `AssignmentProgress`, `assignmentProgress.controller.js`, `studentStatus/*`, `StudentExpandedView` |
| טפסים ומבחנים | 12 סוגי שאלות (סולם, טקסט, אמריקאית, השלמה מבנק, השלמה פתוחה, סידור מילים, סידור על ציר, נכון/לא נכון, התאמה, מטריצה, העלאת קובץ, תיאור), הגשה, ציון, שכפול, טיוטות ב-localStorage | `CreateForms`, `FormBody`, `GradingForm`, `form.controller.js`, `form.service.js` |
| סקרים | טופס מסוג `survey` ודשבורד תוצאות | `SurveyDashboard`, `SurveyMembers` |
| משובים | משוב עם קטגוריות (שימור/שיפור), שאלות, ציון מסכם, קבצים מצורפים, דשבורדים לפי קורס/צוות/חניך | `FeedbackCreate`, `FeedbackEdit`, `FeedbackDashboard*`, `feedback.controller.js` |
| חפיפות (Hofef) | שיבוץ חופף למשימות של חניכים, מאגר משימות לחופף, דשבורד אישי | `HoefOverview`, `HoefTaskPool`, `HoefPersonalDashboard`, `taskAssignmentHoef.controller.js` |
| שימור ידע | תצוגה לפי קורס/מחזור/צוות | `knowledgeRetention/KnowledgeRetention.tsx` |
| מחברת | תיקיות והערות (Quill, JSONB, הערות מקוננות) | `Notebook`, `NoteEditor`, `notebookfolder.js`, `notebooknote.js` |
| קבצים | העלאה ל-S3/MinIO, הזרמה, הורדה, תיקיות קבצים למחזור | `file.controller.js`, `courseBatchFolder*`, `UploadFiles`, `VideoPlayer`, `WaveSurfer` |
| הדרכה | קרוסלת שקפים להסבר המערכת | `AcademixLearning`, `utils/LearningData.ts` |

---

## 3. ארכיטקטורה ומחסנית טכנולוגית

### 3.1 תרשים כללי
```
Browser (React SPA, CRA)
   │  axios (withCredentials, X-User-Id / X-User-Name)
   ▼
Express 5 (app.js) ── /api/* ── 41 routers ── controllers ── Sequelize ── PostgreSQL 16
   │                                                     └── raw SQL (sequelize.query)
   ├── express-ntlm (AUTH_MODE=ntlm) / login מקומי (AUTH_MODE=local)
   ├── multer (memoryStorage) ── @aws-sdk/client-s3 ── MinIO / S3
   └── fluent-ffmpeg (encodeVideo – מיובא אך לא בשימוש)
Browser ── קישורים ישירים לקבצים: ${REACT_APP_S3_BASE_URL}/${bucket}/${key}
```

### 3.2 Backend
| רכיב | גרסה / הערה |
|---|---|
| Express | 5.1, CommonJS |
| ORM | Sequelize 6.37 + `pg` |
| אימות | JWT ב-cookie `token` (httpOnly, תוקף שעתיים) + cookie `userInfo` קריא ל-JS (24 שעות). NTLM דרך `express-ntlm` |
| קבצים | `multer.memoryStorage()` → `PutObjectCommand` עם `ACL: public-read` |
| וידאו | `fluent-ffmpeg` + `@ffmpeg-installer` |
| ולידציה | `express-validator`, בשימוש מועט (`validateUser` בודק `isMongoId` – שריד מפרויקט MongoDB) |
| לוגים | לוגר עצמי (`src/utils/logger.js`) שכותב לקבצים עם `appendFileSync` |
| תלות מיושנת | `request` (deprecated מאז 2020) |

### 3.3 Frontend
| רכיב | גרסה / הערה |
|---|---|
| בנייה | Create React App 5 (`react-scripts`), webpack 5, TypeScript 4.9 |
| UI | Ant Design 5 (RTL, `he_IL`), CSS Modules, styled-components (2 קבצים), כ-1,500 `style={{}}` inline |
| ניתוב | React Router 7 (`createBrowserRouter`), הגנת תפקידים ב-`ProtectedRoute` |
| State שרת | TanStack Query 5 (69 `useQuery`, 33 `useMutation`) |
| State לקוח | Zustand 5 (22 stores, `permissionStore` עם `persist` ל-localStorage) |
| HTTP | שני לקוחות: `api` (axios instance, 96 קריאות) ו-`axios` גלובלי (148 קריאות) + 10 `fetch` |
| לוח שנה | FullCalendar 6 + react-big-calendar |
| גרפים | recharts, chart.js; `@ant-design/charts` / `@ant-design/plots` / `react-chartjs-2` מותקנים ולא מיובאים |
| תאריכים | dayjs (41 קבצים), date-fns (5), moment (1) |
| מדיה | react-player, wavesurfer.js, react-h5-audio-player |
| עורך | react-quill / quill 1.3.7 |

### 3.4 תשתית
- `docker-compose.yml`: PostgreSQL 16 ו-MinIO, כולל יצירת bucket `academix` עם הרשאת קריאה ציבורית.
- אין Dockerfile לאפליקציה עצמה, אין CI, אין reverse proxy מוגדר.
- הסכמה נוצרת ב-`npm run db:init` (`sequelize.sync()`), כי המיגרציות לא עקביות (ראו `README.md` ו-`CHANGES.he.md`).

---

## 4. מודל הנתונים

### 4.1 טבלאות לפי תחום
| תחום | מודלים |
|---|---|
| ארגון | `System`, `Domain`, `Course`, `CourseBatch`, `Team`, `TeamCourseBatch`, `TeamMember`, `User` |
| הרשאות | `Role`, `RoleAssignment` |
| תוכן | `Axis`, `AxisTemplate`, `AxisBatchArchives`, `TaskGroup`, `TaskGroupBatchStatus`, `Task`, `TaskBatchStatus`, `CheckLists`, `TaskChecklistOverlap`, `GradeStages`, `Tags`, `TaskTags`, `TaskVisibilityOverride`, `TeamAxisOrder` |
| שיבוץ | `TaskAssignment`, `TaskAssignmentOccurrence`, `TaskAssignmentHofef`, `AssignmentProgress`, `TeamEvent`, `TeamEventDay`, `TeamEventAssignment` |
| טפסים | `Form`, `FormQuestion`, `FormOption`, `FormSubmission`, `FormSubmissionAnswer` |
| משובים | `Feedback`, `FeedbackCategory`, `FeedbackQuestion`, `FeedbackAnswer`, `FeedbackCategorySelection`, `FeedbackQuestionAnswer` |
| קבצים | `File`, `FileResponse`, `CourseBatchFolder`, `CourseBatchFolderFile` |
| מחברת | `NoteBookFolder`, `NoteBookNote` |

### 4.2 הערות על המודל
- `Axis`, `TaskGroup` ו-`Task` מוגדרים כ-`paranoid` (מחיקה רכה). `TaskAssignment` לא (`paranoid` בהערה).
- **אינדקסים:** רק `TeamAxisOrder` מגדיר אינדקס במודל (unique). כל השאר מסתמכים על המפתח הראשי בלבד. מכיוון שהסכמה נוצרת ב-`sync()`, **אין אינדקסים על אף מפתח זר** (`task_id`, `user_id`, `team_id`, `courseId`, `taskGroupId`, `axisId`, `course_batch_id` וכו'). ב-PostgreSQL מפתח זר לא יוצר אינדקס אוטומטית.
- `TaskAssignment.user_id` מצביע ל-`TeamMember.id` ולא ל-`User.id`, למרות השם (ראו ה-JOIN ב-`taskAssignment.controller.js` ~ש' 1945: `JOIN "TeamMembers" tm ON tm.id = ta.user_id`). זה מבלבל ומועד לשגיאות.
- `Team.course_batch_id` נמצא בהערה במודל (`models/team.js` ש' 63), אבל `getDeveloperData` ב-`src/queries/permissionsQueries.js` עדיין מסנן לפי `Team.course_batch_id`. סביר שזו שאילתה שנכשלת או מחזירה תוצאה שגויה ל-`SYSTEM-ADMIN`/`DEVELOPER`.
- `Form` מגדיר שלוש פעמים `hasMany(models.Task)` עם כינויים שונים, ו-`Task` מגדיר `hasMany(TaskAssignment)` פעמיים.
- `Task.linkUrl` מוגדר כ-`STRING(10000)` – עדיף `TEXT`.
- ערכי ENUM בשאלות טופס הוחלפו לאורך הזמן (`multipleQuestion` ← "anciennement matching_pairs", `matching_pairs` ← "anciennement matrix_single"). זה מקור לבלבול בין FE ל-BE.

---

## 5. Backend – סקירה מפורטת

### 5.1 נקודת כניסה (`app.js`)
- `dotenv` נטען ראשון. CORS לפי `CORS_ORIGINS`, עם `credentials: true`. (`optionSuccessStatus` הוא שם שגוי, הנכון `optionsSuccessStatus`.)
- Middleware לוגים: על כל תגובה עם סטטוס ≥ 400 הוא מריץ `jwt.verify` ומחשב משתנים, **אבל לא כותב שום דבר** (אין קריאה ל-logger). עבודת CPU מיותרת.
- `REQUIRE_AUTH=true` מפעיל `validateJWT` על כל `/api` חוץ מ-`/api/auth`. `validateJWT` מבצע `User.findOne` **בכל בקשה**.
- אין `helmet`, אין `compression`, אין rate limiting, אין הגבלת גודל body מוגדרת במפורש, אין graceful shutdown.
- הבדיקה של `JWT_SECRET` נעשית אחרי טעינת כל ה-routes (אבל לפני `listen`).

### 5.2 שכבות
- **Routes** (41 קבצים): ברובם ממפים ישירות ל-controller. חלק מכילים לוגיקה inline (`permissions.routes.js`, `system.routes.js`, `file.routes.js` – `delete-file`).
- **Controllers** (39 קבצים): רוב הלוגיקה העסקית יושבת כאן. הקבצים הגדולים:
  | קובץ | שורות |
  |---|---|
  | `taskAssignment.controller.js` | 3,351 |
  | `task.controller.js` | 3,286 |
  | `form.controller.js` | 1,701 |
  | `feedback.controller.js` | 1,269 |
  | `taskAssignmentHoef.controller.js` | 1,068 |
  | `queue.controller.js` | 621 |
- **Services** (10 קבצים): שימוש חלקי בלבד. יש controllers שקוראים ל-controllers אחרים (`axis.controller` → `file.controller.deleteFile`).
- **Queries**: `permissionsQueries.js`, `getAllowedTaskGroupIds.js`.
- **SQL גולמי**: כ-150 קריאות `sequelize.query`, בעיקר ב-`task`, `taskAssignment`, `taskAssignmentHoef`, `queue`, `form.service`. רוב הקריאות משתמשות ב-`replacements` (89 מקומות), אבל יש שרשור מחרוזות ישיר (ראו סעיף 7).

### 5.3 בעיות ניתוב שנמצאו
| קובץ | בעיה |
|---|---|
| `teamEventAssignment.routes.js` | `GET /:teamEventsIds` מוגדר לפני `GET /:id`, ולכן `/:id` אף פעם לא נקרא |
| `taskAssignment.routes.js` ש' 22–23 | `GET /:id` מוגדר פעמיים. בנוסף `GET /:id` מוגדר לפני routes כמו `/:date/assignedTeam/...` (תקין רק כי מספר הסגמנטים שונה) |
| `form.routes.js` ש' 6 | `'/formId:formId'` (בלי `/`) – הנתיב בפועל הוא `/formId123` |
| `forms.routes.js` | קיים לצד `form.routes.js` ולא מחובר ב-`app.js` |
| `assignmentProgressRoutes` | הנתיב `/api/assignmen_progress` (שגיאת כתיב בתוך ה-API) |
| `validateUser.js` | בודק `isMongoId` ותפקידים `admin`/`readonly` שלא קיימים במערכת |

### 5.4 אימות והרשאות
- **זיהוי משתמש:** ה-Frontend שולח `X-User-Id` / `X-User-Name` מתוך localStorage בכל בקשה. השרת משתמש בהם, למשל `creatorId` ב-`uploadFile`, ובכ-138 מקומות ב-`src`. כל לקוח יכול לשלוח כל ערך.
- **הרשאות:** `GET /api/permissions/my/:userId` מחשב את כל ההרשאות של המשתמש (`permissions.service.js`). התוצאה נשמרת ב-localStorage, ובכל בקשה הלקוח שולח את רשימות המזהים המותרים ב-query string (`getAllowedAxes?allowedAxesIds=1,2,3`). השרת מחזיר את מה שביקשו בלי לבדוק.
- `:userId` ב-`/permissions/my/:userId` לא נבדק מול המשתמש המחובר, כך שאפשר לקבל הרשאות של כל משתמש.
- `streamFile` בודק גישה לפי `teamMemberId` / `teamId` שמגיעים מהלקוח.

### 5.5 קבצים ומדיה
- העלאה: `multer.memoryStorage()` **בלי `limits`**. כל קובץ (כולל וידאו) נטען במלואו ל-RAM ואז נשלח ל-S3 בבקשה אחת (`PutObjectCommand`, בלי multipart).
- כל קובץ מועלה עם `ACL: public-read`, וה-bucket מוגדר לקריאה ציבורית. ה-Frontend ניגש לקבצים בקישור ישיר, ולכן בדיקת ההרשאות ב-`streamFile` לא מגינה בפועל.
- `streamFile` **לא תומך בכותרת `Range`**. בווידאו ובאודיו הדפדפן לא יכול לקפוץ למקום מסוים בלי להוריד הכול, ובחלק מהדפדפנים seek לא עובד בכלל.
- `encodeBuffer` (ffmpeg) מיובא ב-`file.controller.js` אך לא נקרא.

### 5.6 לוגים וטיפול בשגיאות
- `logger.js` כותב עם `fs.appendFileSync` – פעולה **חוסמת** של ה-event loop בכל שורת לוג. אין rotation (בעבר הצטברו כ-68MB).
- הלוג כולל `body`, `params`, `query`, שם משתמש ו-IP, כלומר מידע אישי ואולי סיסמאות (למשל ב-`/auth/login` אם נכשל).
- `fixHebrewForConsole` הופך כל מחרוזת עברית תו-תו לכל לוג בפיתוח.
- `utils/errorHandler.catchError` מחזיר `error.message` ללקוח תמיד, גם ב-production (בניגוד ל-`middlewares/errorHandler`).
- `generateErrorId` משתמש ב-`substr` (deprecated).

### 5.7 בסיס נתונים
- אין הגדרת `pool` ב-`config/config.js`, כלומר ברירת המחדל של Sequelize: מקסימום 5 חיבורים. תחת עומס בקשות ימתינו לחיבור.
- 50 מיגרציות לא עקביות: טבלאות חסרות, כפילויות (`GradeStages` ×3, `CheckLists` ×2), חותמות זמן לא תקינות. בפועל משתמשים ב-`sync()`, ואין דרך מבוקרת לשנות סכמה בייצור.
- טרנזקציות קיימות ב-6 controllers בלבד. פעולות מרובות שלבים אחרות (מחיקת ציר עם קבצים, שכפול) לא אטומיות.

---

## 6. Frontend – סקירה מפורטת

### 6.1 אתחול (`index.tsx`, `App.tsx`)
- `React.StrictMode` → `LoadingProvider` → `GlobalLoader` → `App`.
- `App` מריץ `useUserAuth` (קורא ל-`/auth/mode` ואז `/auth/me` או `/auth/ntlm`) ו-`useDateValidation`.
- `useEffect` ב-`App` מסנכרן את ה-cookie `userInfo` ל-localStorage, ובמקרה של כשל **מרענן את הדף** (`window.location.reload()` אחרי שנייה). זה עלול ליצור לולאת רענון.
- במצב NTLM האפליקציה מוצגת **לפני** שהמשתמש זוהה (`setStatus("ready")` לפני `fetchUser`).
- `QueryClientProvider` עוטף רק את ה-Router (לא את `Login`).

### 6.2 ניתוב (`routes/AppRoutes.tsx`)
- כ-40 נתיבים. **כל דפי האפליקציה מיובאים סטטית** (אין `React.lazy`), כך שכל הקוד נטען בכניסה הראשונה.
- `ProtectedRoute` מאפשר גישה **כשאין `selectedPermission`** (`if (!selectedPermission) return true`) ומנתב ל-`/unauthorized`, נתיב שלא קיים (נופל ל-404).
- `PermissionGate.tsx` לא עובד: ה-`<Navigate>` נוצר ולא מוחזר.
- נתיבים כמו `/calendar`, `/courseContent`, `/Notebook`, `/feedback/*` לא מוגנים לפי תפקיד.

### 6.3 שכבת נתונים
- **שני לקוחות HTTP:** `api/axios.ts` (עם interceptors לכותרות זהות ול-Loader) ו-`axios` הגלובלי, שמקבל interceptor נפרד ב-`ApiServices.ts`. קריאות דרך `axios` הגלובלי לא מפעילות את ה-Loader ולא עוברות את אותו טיפול. בנוסף כ-10 קריאות `fetch`.
- `services/ApiServices.ts`: קובץ יחיד של 2,101 שורות עם כל הקריאות. חלק מהפונקציות בולעות שגיאות ומחזירות `undefined`.
- **React Query:**
  - ברירות מחדל: `retry: 2`, `refetchOnWindowFocus/Mount/Reconnect: false`. ברוב ה-queries אין `staleTime` (רק 29 מקומות), ובמקביל יש 119 `invalidateQueries` ו-72 `refetchQueries`/`resetQueries`. ההתנהגות בפועל: פחות טעינות אוטומטיות, אבל גלי טעינה ידניים אחרי כל mutation.
  - **התנגשות מפתחות:** `useFetchFeedbackByUser` ו-`useFetchMissedFeedbacksByMemberId` משתמשים שניהם ב-`["feedbackByUserId", teamMemberId]`, עם נתונים בצורה שונה. אחד דורס את השני ב-cache.
  - חלק מהמפתחות כוללים אובייקטים שלמים (`selectedPermission`), כך שכל שינוי באובייקט יוצר ערך חדש ב-cache.
- **Zustand:** 22 stores, חלקם משכפלים state של השרת (`taskStore`, `teamStore`, `courseStore`...) במקביל ל-React Query. יש שני מקורות אמת.
  - קובץ בשם `store/כeedbackStore.ts` (אות עברית בשם הקובץ).
  - `permissionStore` שומר את כל ההרשאות (כולל רשימות מזהים ארוכות) ב-localStorage.
- `useEffect` + קריאת API ישירה ב-57 קבצים, במקום React Query.

### 6.4 קומפוננטות גדולות
| קובץ | שורות | `useState` |
|---|---|---|
| `pages/calendar/Calendar.tsx` | 2,287 | 22 |
| `components/HoefOverview/HoefOverview.tsx` | 1,914 | 21 |
| `components/NewTaskModal/NewTaskModal.tsx` | 1,885 | 37 |
| `components/UserTaskModal/UserTaskModal.tsx` | 1,450 | 13 |
| `components/Modals/TaskMembersStatus/TaskMembersStatus.tsx` | 1,174 | – |
| `components/layout/Sidebar/DayCalendar/DayCalendar.tsx` | 1,167 | – |
| `pages/knowledgeRetention/KnowledgeRetention.tsx` | 1,135 | – |

קומפוננטות בגודל כזה גורמות לרינדור מחדש של כל העץ בכל שינוי state, וקשה לתחזק אותן. `React.memo` קיים רק ב-7 מקומות.

### 6.5 עיצוב
- שילוב של CSS Modules (כ-24,000 שורות CSS), קבצי CSS גלובליים (`axisboard.css`, `Layout.css`, `Calendar.css`...), styled-components ו-1,518 `style={{}}` inline. כל style inline יוצר אובייקט חדש בכל רינדור ומונע memoization.
- גופנים: `NotoSansHebrew-VariableFont` בפורמט **TTF** (לא woff2) וגם `VarelaRound` ב-woff2.

### 6.6 מדיה
- התיקייה `src/media/` מכילה כרגע placeholders (130KB). `utils/LearningData.ts` מייבא סטטית כ-67 שקפי PNG. עם המדיה האמיתית, כל השקפים ייכנסו ל-bundle הראשי או יועתקו ל-build ויבקשו טעינה מוקדמת.

### 6.7 שונות
- 143 `console.log` בקוד ה-Frontend.
- כ-1,190 שימושים ב-`any` / `as any`.
- `useQueryDebugger` (עם `setInterval`) קיים אך מנוטרל.
- טיוטות טפסים ותשובות נשמרות ב-localStorage (`formDraftStorage`, `answerDraftStorage`), בלי ניקוי לפי זמן.

---

## 7. אבטחה

(רשימה לידיעה בלבד – לא תוקן דבר.)

| חומרה | בעיה | מיקום |
|---|---|---|
| קריטי | בלי `REQUIRE_AUTH=true` אף נתיב `/api/*` לא דורש אימות | `app.js` |
| קריטי | זהות המשתמש נלקחת מכותרות `X-User-Id` / `X-User-Name` שהלקוח קובע | `api/axios.ts`, `ApiServices.ts`, כ-138 מקומות ב-BE |
| קריטי | ההרשאות (רשימות מזהים מותרים) נשלחות מהלקוח ולא נבדקות בשרת | `axis/course/courseBatch/domain/axisBatchArchive.controller.js` |
| קריטי | `GET /permissions/my/:userId` מחזיר הרשאות של כל משתמש | `routes/permissions.routes.js` |
| גבוה | SQL Injection: `assignmentIdsList`, `taskIdNum`, `teamId` משורשרים ישירות לשאילתה | `taskAssignment.controller.js` ~ש' 1945–1948 |
| גבוה | שרשור קטעי SQL דינמיים (`${colorSelect}`, `${blockDateFilter}`, `${whereClause}`, `${hasSpecialPermission}`) – צריך לוודא שאין בהם קלט משתמש | `task.controller.js` ש' 355, 383–384, 1287, 1324, 3161–3162; `taskAssignment.controller.js` ש' 1179, 1223 |
| גבוה | כל הקבצים `public-read` וה-bucket ציבורי: כל מי שיודע את ה-key יכול להוריד | `file.controller.js`, `docker-compose.yml` |
| גבוה | העלאת קבצים בלי הגבלת גודל או סוג (DoS דרך RAM) | `file.routes.js`, `courseBatchFolderFile.routes.js` |
| בינוני | `error.message` מוחזר ללקוח | `utils/errorHandler.js` |
| בינוני | הלוגים שומרים body מלא, IP ושמות משתמשים | `utils/logger.js` |
| בינוני | אין helmet, rate limiting (כולל על `/auth/login`), CSRF | `app.js` |
| בינוני | cookie `userInfo` קריא ל-JS, ושכפול ל-localStorage | `auth.js`, `App.tsx` |
| נמוך | `rejectUnauthorized: false` בקריאות פנימיות, חבילת `request` deprecated | `user.controller.js` |

---

## 8. איכות קוד ותחזוקה

- **אין בדיקות** בכלל (לא unit, לא integration, לא e2e).
- **אין lint/format אחיד** ב-Backend. ב-Frontend רק ה-ESLint של CRA.
- **שמות לא עקביים:** `teamEvent.conroller.js`, `autth-ntlm.js`, `PermmisionsCurseBatch`, `CalendatHeader`, `Delyas`, `FormDetailes`, `GrdaeStageCard`, `utills`, `כeedbackStore.ts`, `CommandStuffManager`; קבצים ב-camelCase, PascalCase ו-kebab-case מעורבבים.
- **קוד מת:** קוד בהערות, `forms.routes.js` לא מחובר, `encodeBuffer` לא בשימוש, `PermissionGate` לא פועל, middleware לוגים שלא כותב, `fixFileName.js` בשורש ה-Backend.
- **תלויות לא בשימוש (FE):** `@ant-design/charts`, `@ant-design/plots`, `react-chartjs-2`, `es-toolkit`, `rc-tween-one`, `react-spinners`, `@testing-library/react` ב-dependencies, `@types/react-big-calendar` ב-dependencies ולא ב-devDependencies.
- **ערבוב שפות** בהערות ובהודעות (עברית, אנגלית, צרפתית).
- **TypeScript חלש:** כ-1,190 `any`, ו-`types/types.ts` של 834 שורות.

---

## 9. שיפורי ביצועים – Backend

הסדר הוא לפי יחס תועלת/מאמץ (הכי משתלם קודם).

### 9.1 אינדקסים בבסיס הנתונים (השפעה גבוהה מאוד, מאמץ נמוך)
אין כרגע אינדקסים על מפתחות זרים, וכל JOIN או `WHERE` על עמודה כזו הוא סריקה מלאה של הטבלה. מומלץ להוסיף (במודלים תחת `indexes`, או במיגרציה חדשה ונקייה):

| טבלה | עמודות |
|---|---|
| `TaskAssignments` | `task_id`, `user_id`, `team_id`, (`team_id`, `start`, `end`), (`task_id`, `team_id`) |
| `TaskAssignmentOccurrences` | `task_assignment_id`, (`start`, `end`) |
| `Tasks` | `taskGroupId`, `teamId`, `gradeStageId`, `formId`, `feedbackId`, `creatorId`, `color` |
| `TaskGroups` / `Axes` | `axisId` / `courseId`, `teamId` |
| `TaskBatchStatus`, `TaskGroupBatchStatus`, `AxisBatchArchives` | (`taskId`/`taskGroupId`/`axis_id`, `course_batch_id`) unique |
| `TeamMembers` | `user_id`, `team_id`, `course_batch_id`, (`team_id`, `member_role`) |
| `TeamCourseBatches` | (`team_id`, `course_batch_id`) unique, `course_batch_id` |
| `RoleAssignments` | `user_id`, (`role_code`, `scope_id`), (`scope_type`, `scope_id`) |
| `FormSubmissions` / `FormSubmissionAnswers` | `task_assignment_id`, `form_id` / `form_submission_id`, `question_id` |
| `FeedbackAnswers`, `FeedbackCategorySelections`, `FeedbackQuestionAnswers` | `task_assignment_id`, `feedback_id` |
| `Files` | `s3Key` (מחפשים לפיו ב-`streamFile`), `taskId`, `task_assignment_id`, `feedback_answer_id` |
| `AssignmentProgress` | `task_assignment_id` |
| `TaskTags` | (`task_id`, `tag_id`) |
| `Users` | `username` (כבר unique), `militaryid` |

לאחר מכן להריץ `EXPLAIN ANALYZE` על השאילתות הכבדות של לוח השנה, התור והחפיפות.

### 9.2 חישוב הרשאות (השפעה גבוהה)
`getPermissionsForUser` מריץ לכל שיבוץ תפקיד 5–9 שאילתות ברצף (`Course.findAll` ← `CourseBatch.findAll` ← `TeamCourseBatch.findAll` ← `Team.findAll` ← `Axis.findAll` ← `Course.findByPk` ← `Domain.findAll`...). למשתמש עם 10 שיבוצים מדובר ב-50–90 שאילתות.
- להחליף בשאילתת SQL אחת לכל scope עם JOIN או CTE, או בשאילתה רקורסיבית אחת לכל ההרשאות.
- לשלוף רק `attributes: ['id']` (כרגע נשלפות שורות מלאות, למשל `Course.findAll({ where: { domainId: id } })`).
- להריץ במקביל (`Promise.all`) שאילתות שלא תלויות זו בזו (צירים ומחזורים).
- לשמור את התוצאה ב-cache בצד השרת (בזיכרון עם TTL, או Redis) לפי `userId`, ולנקות אותה כשמשתנה `RoleAssignment`.
- להעביר את האכיפה לשרת: לחשב את ה-scope מה-JWT במקום לקבל רשימות מזהים ב-query string. זה גם תיקון אבטחה וגם מקצר URLs ארוכים מאוד.

### 9.3 ביטול N+1 (השפעה גבוהה)
בקבצים `taskAssignment` (53 לולאות), `task` (73), `form` (48), `feedback` (36) ו-`taskAssignmentHoef` (18) יש הרבה `await` בתוך `for` או `map`. לדוגמה:
- `taskAssignment.controller.js` ~ש' 187: `await TaskAssignment.update` בתוך לולאה. להחליף ב-`update` אחד עם `where: { id: ids }`, או `bulkCreate` עם `updateOnDuplicate`.
- `task.controller.js` ~ש' 658, 672, 695: `CheckLists.create`, `File.create`, `TaskTags.create` בלולאה בזמן שכפול משימה. להחליף ב-`bulkCreate`.
- `task.controller.js` ~ש' 821 ו-`axis.controller.js`: `deleteFile` לכל קובץ בנפרד. להשתמש ב-`DeleteObjectsCommand` (עד 1,000 מפתחות בקריאה) וב-`destroy` אחד.
- כשחייבים פעולות נפרדות, לבצע אותן במקביל עם הגבלה (`p-limit`) ובתוך טרנזקציה.

### 9.4 Pagination והגבלת נתונים (השפעה גבוהה)
- `limit`/`offset` מופיעים רק פעמיים בכל ה-Backend. כל `getAll` (`Axis.findAll()`, `getAllUsers`, `getAllTaskAssignments`, `getAllFeedbacks`, `getAllForms`...) מחזיר את כל הטבלה.
- להוסיף pagination (עדיף keyset/cursor) ו-`attributes` מפורשים.
- `calendar.service.js`: `getCalendarTasks` מקבל `userId` ולא משתמש בו, מסנן לפי `createdAt` (לא לפי תאריכי השיבוץ), וטוען `include` של ארבע רמות כולל **כל** `CourseBatch` של הקורס לכל משימה. לצמצם ל-`attributes` הנדרשים ולשקול `separate: true` או שאילתה ייעודית.
- להעדיף `raw: true` בשאילתות קריאה בלבד, כדי לחסוך יצירת מופעי מודל.

### 9.5 Connection pool (מאמץ נמוך)
להגדיר ב-`config/config.js`:
```js
pool: { max: 20, min: 2, acquire: 30000, idle: 10000 }
```
ולהתאים לפי מספר המעבדים ו-`max_connections` של PostgreSQL. כרגע מקסימום 5 חיבורים.

### 9.6 לוגים (מאמץ נמוך)
- להחליף את `appendFileSync` בכתיבה אסינכרונית (`fs.createWriteStream`) או בספרייה כמו `pino` (עם `pino-roll`), כולל rotation.
- להסיר מה-middleware ב-`app.js` את ה-`jwt.verify` שלא משמש לכלום, או לממש אותו כראוי.
- לא להריץ `fixHebrewForConsole` ולא לבנות מחרוזות צבעוניות כשאין מסוף.
- לא לרשום `body` מלא (גודל ופרטיות).
- להחליף את 61 ה-`console.log` ב-`logger.debug`.

### 9.7 קבצים ווידאו (השפעה גבוהה על חוויית המשתמש)
- **תמיכה ב-`Range`** ב-`streamFile`: להעביר את `req.headers.range` ל-`GetObjectCommand` ולהחזיר `206` עם `Content-Range`, `Accept-Ranges` ו-`Content-Length`.
- **עדיף:** להחזיר מהשרת **Presigned URL** (`@aws-sdk/s3-request-presigner`) אחרי בדיקת הרשאה, והדפדפן יוריד ישירות מ-MinIO/S3. זה מוריד את כל תעבורת הקבצים מ-Node, ובמקביל מאפשר לבטל את `public-read`.
- **העלאה:** להחליף את `memoryStorage` ב-streaming (`@aws-sdk/lib-storage` `Upload` עם multipart), או להעלות ישירות מהדפדפן עם Presigned POST. להוסיף `limits: { fileSize }`.
- אם יש צורך בקידוד וידאו (`encodeBuffer`), להריץ אותו ב-worker או בתור (BullMQ) ולא בתוך הבקשה.

### 9.8 HTTP
- להוסיף `compression()` (gzip/brotli) לתגובות JSON. יש תגובות גדולות מאוד (לוח שנה, תור, דשבורדים).
- להוסיף `ETag` / `Cache-Control` לנתונים שמשתנים לעיתים רחוקות (תפקידים, תחומים, קורסים, תגיות, שלבי הסמכה).
- להגיש את ה-Frontend הבנוי מאחורי reverse proxy (nginx) עם cache ארוך לקבצים סטטיים ו-HTTP/2.

### 9.9 Caching
- cache בזיכרון (`lru-cache`) או Redis לנתונים ייחוסיים: `Role`, `System`, `Domain`, `Course`, `Tags`, `GradeStages`, ותוצאות הרשאות.
- `validateJWT`: לשמור את `req.user` מתוך ה-JWT עצמו (להכניס `id` ל-payload, כרגע יש רק `name` ו-`username`) או מ-cache, במקום `User.findOne` בכל בקשה.

### 9.10 מבנה ושאילתות
- לפצל את ה-controllers הגדולים ל-services ו-repositories, ולהעביר את ה-SQL הגולמי לקבצים או פונקציות ייעודיות עם פרמטרים, כדי שיהיה אפשר למדוד ולבצע אופטימיזציה לכל שאילתה.
- לאחד לוגיקה חוזרת: מיפוי `statusMap` לפי `${taskId}-${course_batch_id}` מופיע לפחות 6 פעמים ב-`task.controller.js`.
- להשתמש ב-`pg_stat_statements` כדי לזהות את השאילתות האיטיות בפועל.
- להעביר חישובים כבדים לסטטיסטיקות (דשבורדים, ספירות לפי שלב הסמכה) ל-materialized views או לטבלאות מצטברות שמתעדכנות ברקע.

### 9.11 תפעול
- להריץ עם `NODE_ENV=production` (משפיע על Express ועל הלוגר).
- PM2 / cluster mode, או כמה מופעים מאחורי load balancer, כדי לנצל כמה ליבות.
- graceful shutdown (סגירת pool ו-server).
- ניטור: זמני תגובה לכל endpoint (למשל `prom-client`), ולוג שאילתות איטיות (`DB_LOGGING` עם `benchmark: true` וסף).

---

## 10. שיפורי ביצועים – Frontend

### 10.1 Code splitting (השפעה גבוהה מאוד, מאמץ נמוך)
כל ~40 הדפים מיובאים סטטית ב-`AppRoutes.tsx`. מומלץ:
```tsx
const Calendar = lazy(() => import("../pages/calendar/Calendar"));
// ... + <Suspense fallback={<Spin />}>
```
או `lazy` של React Router 7 בכל route. במיוחד לדפים כבדים: `Calendar` (FullCalendar), `SurveyDashboard` (chart.js), דשבורדים עם recharts, `Notebook` (Quill), `CreateForms`, `HoefOverview`, `KnowledgeRetention`, `UserTaskModal` (נגני מדיה, wavesurfer).
גם מודלים כבדים (`NewTaskModal`, `UserTaskModal`) כדאי לטעון ב-lazy רק כשנפתחים.

### 10.2 ניקוי תלויות כפולות (השפעה גבוהה)
| כפילות | המלצה |
|---|---|
| moment (1 קובץ) + date-fns (5) + dayjs (41) | להשאיר רק **dayjs** (כבר בשימוש ב-antd). moment לבד הוא כ-70KB gzip עם locales |
| FullCalendar + react-big-calendar (1 קובץ: `CalendarComponent.tsx`) | להשאיר FullCalendar בלבד |
| recharts + chart.js + `@ant-design/charts` + `@ant-design/plots` + `react-chartjs-2` | לבחור ספרייה אחת (recharts כבר ב-9 קבצים). להסיר את החבילות שלא מיובאות |
| lodash (`import _ from "lodash"` ב-`NewTaskModal.tsx`, `taskStore.ts`) + es-toolkit | להשתמש ב-`lodash-es` עם ייבוא נקודתי, או להסתפק ב-es-toolkit. `import { divide } from "lodash"` / `assign` – כנראה ייבוא אוטומטי שגוי |
| styled-components (2 קבצים) | להסיר ולהעביר ל-CSS Modules |
| `react-player` | לייבא `react-player/lazy` או את הנגן הספציפי (file) |

אחרי הניקוי למדוד עם `source-map-explorer build/static/js/*.js`.

### 10.3 שכבת נתונים (השפעה גבוהה)
- **לאחד ללקוח HTTP אחד** (`api/axios.ts`): להעביר את 148 קריאות `axios.*` ו-10 קריאות `fetch` ל-`api`.
- **להעביר את 57 הקבצים עם `useEffect` + API ל-React Query**, עם hooks ייעודיים.
- **להגדיר `staleTime` ברירת מחדל** (למשל 30–60 שניות) ו-`staleTime: Infinity` לנתונים ייחוסיים (תפקידים, תחומים, תגיות, שלבי הסמכה). כך `invalidateQueries` יעבוד בצורה צפויה, ואפשר לצמצם את 72 קריאות `refetchQueries`/`resetQueries`.
- **לתקן מפתחות queries:** להפריד את `["feedbackByUserId", ...]` המשותף, לא להכניס אובייקטים שלמים (`selectedPermission`) אלא רק `selectedPermission.id`, ולרכז את המפתחות ב-query key factory.
- **עדכונים אופטימיים** (`onMutate` + `setQueryData`) לפעולות תכופות: גרירת משימות בלוח שנה, סימון התקדמות, סידור צירים. במקום invalidate + טעינה מלאה מחדש.
- **לבטל כפילות Zustand ↔ React Query:** Zustand רק ל-state של UI (בחירות, מודלים פתוחים, הרשאה פעילה). נתוני שרת רק ב-React Query.
- `retry: 2` על כל query גורם לשלוש בקשות לכל שגיאת 4xx. עדיף `retry: (count, err) => err.status >= 500 && count < 2`.
- `prefetchQuery` במעבר בין שבועות בלוח השנה ובריחוף על כרטיסים.

### 10.4 Loader גלובלי (השפעה גבוהה על הביצועים הנתפסים)
`LoadingService` מציג Loader גלובלי לכל בקשה דרך `api`. כל refetch ברקע חוסם את המסך כולו ונותן תחושה של איטיות.
- להציג Loader מקומי (`isLoading` / `isFetching` של ה-query) או skeletons של antd.
- להשאיר Loader גלובלי רק לפעולות שחייבות לחסום (שמירה, העלאה), דרך `meta`.

### 10.5 רינדור
- **לפצל את קומפוננטות הענק** (`Calendar.tsx` 2,287 שורות / 22 state, `NewTaskModal.tsx` 1,885 / 37 state, `HoefOverview.tsx` 1,914). להעביר state למקום הקרוב ביותר לשימוש, ולהשתמש ב-`useReducer` או בטופס של antd (`Form.useForm`) במקום עשרות `useState`.
- `React.memo` על פריטים ברשימות (`Task`, `TaskGroup`, `AxisCard`, `TaskUserTag`, `StudentStatusCard`, `EventContent` של FullCalendar), עם `useCallback` ל-handlers שמועברים אליהם (כרגע רק 29 `useCallback`).
- **`eventContent` של FullCalendar** (`EventContent.tsx`, 657 שורות) מרונדר לכל אירוע. לפשט, לעשות memo ולהעביר חישובים מחוץ לרינדור.
- **Selectors ב-Zustand:** לוודא שכל שימוש הוא `useStore(s => s.x)` ולא `useStore()` שלם (למשל `useUserStore()` ב-`useUserAuth.ts`), אחרת כל שינוי ב-store מרנדר את כל הצרכנים. עבור כמה שדות להשתמש ב-`useShallow`.
- **Inline styles:** 1,518 `style={{}}`. להעביר ל-CSS Modules, או לפחות לקבועים מחוץ לקומפוננטה.
- **וירטואליזציה:** לטבלאות ולרשימות ארוכות (חניכים, משימות במאגר, הגשות, `StudentsTable`, `HoefTaskPool`) להפעיל `virtual` של antd Table (כבר קיים ב-3 מקומות) או `react-window`.
- **Debounce** לחיפוש (`useTaskSearch`, `useAdvancedSearch`, `QueryBuilder`) אם עדיין אין.
- `React.StrictMode` מריץ effects פעמיים בפיתוח בלבד, ולכן לא משפיע על ייצור. לא לשפוט ביצועים לפי `npm start`.

### 10.6 נכסים סטטיים
- `LearningData.ts` מייבא סטטית כ-67 שקפים. לטעון אותם ב-lazy (`import()` דינמי, או קבצים ב-`public/` עם `loading="lazy"`), ולהמיר ל-**WebP/AVIF** עם דחיסה.
- גופן `NotoSansHebrew` ב-TTF: להמיר ל-**woff2** עם subset (עברית + לטינית בסיסית), ולהוסיף `font-display: swap` ו-`<link rel="preload">`.
- תמונות משתמשים (`Photo.tsx`): `loading="lazy"`, מידות קבועות, cache.

### 10.7 בנייה
- **מעבר מ-CRA ל-Vite** (CRA לא מתוחזק מאז 2023): בנייה ו-HMR מהירים פי כמה, tree-shaking טוב יותר, `manualChunks` לספריות (antd, fullcalendar, recharts), ואין צורך ב-`--max-old-space-size=4096`.
- שדרוג ל-TypeScript 5 (מבטל את ה-`override` של `@types/d3-dispatch`).
- `browserslist` מודרני יותר ל-production, כי זו רשת סגורה עם דפדפנים ידועים. פחות polyfills.
- לוודא `GENERATE_SOURCEMAP=false` ב-build לייצור, או להעלות את ה-source maps בנפרד.
- להסיר `console.log` ב-build (כלל ESLint `no-console`, או `drop_console` ב-terser/esbuild).

### 10.8 localStorage
- `permissionStore` שומר רשימות מזהים ארוכות. מספיק לשמור `selectedPermissionId` ולטעון את השאר מה-API, כי פירוק JSON גדול בכל טעינה עולה זמן.
- טיוטות טפסים: ניקוי אוטומטי לפי תאריך.

### 10.9 מדידה
- להפעיל `reportWebVitals` (קיים בהערה ב-`index.tsx`) ולמדוד LCP / INP / CLS.
- React DevTools Profiler על לוח השנה ועל `NewTaskModal`.
- `source-map-explorer` או `webpack-bundle-analyzer` לפני ואחרי כל שלב.

---

## 11. תוכנית עבודה מומלצת לפי סדר עדיפויות

| שלב | משימה | תחום | השפעה | מאמץ |
|---|---|---|---|---|
| 1 | אינדקסים על כל המפתחות הזרים (9.1) | BE/DB | גבוהה מאוד | נמוך |
| 1 | `pool` ל-Sequelize, `compression`, לוגר אסינכרוני (9.5, 9.6, 9.8) | BE | גבוהה | נמוך |
| 1 | `React.lazy` לכל הדפים והמודלים הכבדים (10.1) | FE | גבוהה מאוד | נמוך |
| 1 | הסרת moment, react-big-calendar וספריות גרפים מיותרות (10.2) | FE | גבוהה | נמוך |
| 2 | `staleTime` ברירת מחדל, תיקון מפתחות queries, Loader מקומי (10.3, 10.4) | FE | גבוהה | בינוני |
| 2 | חישוב הרשאות בשאילתה אחת + cache (9.2) | BE | גבוהה | בינוני |
| 2 | תמיכה ב-Range או Presigned URLs לקבצים, העלאה ב-streaming (9.7) | BE | גבוהה | בינוני |
| 2 | ביטול N+1 בלולאות הבולטות (9.3) | BE | גבוהה | בינוני |
| 3 | אכיפת הרשאות וזהות בשרת (JWT בלבד, בלי `X-User-Id` ובלי `allowed*Ids` מהלקוח) | BE+FE | אבטחה + ביצועים | גבוה |
| 3 | Pagination לכל רשימות ה-`getAll` (9.4) | BE+FE | בינונית–גבוהה | בינוני |
| 3 | לקוח HTTP אחד, מעבר מלא ל-React Query, ביטול כפילות Zustand (10.3) | FE | בינונית | גבוה |
| 4 | פיצול קומפוננטות הענק ו-memoization (10.5) | FE | בינונית | גבוה |
| 4 | פיצול controllers ל-services, הוספת בדיקות | BE | תחזוקה | גבוה |
| 4 | מעבר ל-Vite ול-TypeScript 5 (10.7) | FE | בינונית | בינוני |
| 4 | מיגרציה בסיסית נקייה במקום `sync()` | DB | יציבות | בינוני |

> **הערה:** מומלץ למדוד לפני כל שינוי (זמני תגובה לכל endpoint, `EXPLAIN ANALYZE`, גודל bundle, Web Vitals) כדי לאמת את ההשפעה בפועל.

</div>
