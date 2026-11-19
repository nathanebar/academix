<div dir="rtl">

# Academix – סיכום השינויים להרצה מחוץ לרשת

המסמך מסכם את כל מה ששונה בפרויקט כדי שירוץ מחוץ לרשת הסגורה, ואת מה שצריך לעשות כדי להחזיר אותו לרשת. הוראות הרצה מלאות נמצאות ב-`README.md`.

---

## 1. בעיות שנמצאו בסקירת הקוד

### Backend
- כל קבצי הקוד היו בסיומת **`.txt`**. בפועל זה JavaScript רגיל (CommonJS) ואין בו TypeScript.
- סקריפט ההרצה השתמש ב-`ts-node`, שאינו נחוץ, וה-`tsconfig.json` היה שבור.
- `models/index` טען רק קבצי `.js` וקרא את `config/config.json`, שבו סיסמאות כתובות בקוד.
- לא היה קובץ `.env`. בלי `PORT` ובלי `JWT_SECRET` השרת לא עובד.
- `dotenv.config()` נקרא **אחרי** טעינת ה-routes, ולכן המשתנים לא נטענו בזמן.
- CORS הוגדר עם `origin: []`, כלומר שום Frontend לא היה מורשה.
- **המיגרציות לא עקביות:**
  - הטבלה `TeamCourseBatches` לא נוצרת באף מיגרציה.
  - יש מפתחות זרים לטבלאות שנוצרות מאוחר יותר.
  - `GradeStages` נוצרת שלוש פעמים ו-`CheckLists` פעמיים.
  - יש חותמות זמן לא תקינות (`9999999999`, `32323555552323`).
  - לטבלאות `course_batch_folders` ו-`course_batch_folder_files` אין מיגרציה בכלל.
- NTLM הוגדר בלי בקר דומיין. השגיאות החזירו 200 והמשיכו, והמידלוור נוצר מחדש בכל בקשה.
- `user.controller` כלל:
  - כתובות API פנימיות לא תקינות;
  - Cookie ו-JWT אמיתיים כתובים בקוד;
  - שימוש במשתנה `cookie` שלא הוגדר ב-`getUserPhoto` (ReferenceError).
- ב-`encodeVideo` המשתנים `req`, `res` ו-`path` לא היו מוגדרים.
- `StorageClass: STANDARD_IA` עלול להידחות ב-MinIO.

### Frontend
- **התיקייה `src/media/` חסרה**, ובערך 140 importים מפנים אליה.
- שני קבצי CSS module חסרים: `SurveyMembers.module.css` ו-`ShowForm.module.css`.
- `import { text } from "body-parser"`: ייבוא Node מיותר ששובר את ה-build.
- `@types/react` בגרסה 19 מול React 18, ו-`@types/node` בגרסה 24 מול TypeScript 4.9.
- `@types/d3-dispatch@3.0.7` (תלות עקיפה של הגרפים) דורש TypeScript 5.
- לא היה `.env` (`REACT_APP_API_BASE_URL` וכו') ולא היה Proxy.
- לא היה דף התחברות. האפליקציה הסתמכה רק על NTLM.
- היו משאבים חיצוניים ופנימיים: Google Fonts, שרת התמונות ושרת הצ'אט הפנימיים.
- שתי שגיאות TypeScript: `HI_CHAT_URL` לא מוגדר, ו-`candidateUrls` ריק בלי טיפוס.

---

## 2. השינויים שבוצעו

### Backend (`academix-backend/`)
| שינוי | קבצים |
|---|---|
| כל קבצי `.txt` שונו ל-`.js`. `create-axis copy` שונה ל-`create-axis`. | כל הפרויקט |
| נמחקו `tsconfig.json` ו-`src/middlewares/ntlm.js` (קוד מת שתלוי בחבילה שאינה מותקנת). | – |
| `package.json` חדש: `start` / `dev` עם node ו-nodemon, וסקריפטים `db:init`, `db:seed`, `user:create`. הוסרו חבילות שלא היה בהן שימוש. | `package.json` |
| הגדרות מסד הנתונים נקראות מ-`.env` (`DB_HOST`, `DB_PORT`, `DB_NAME`, `DB_USER`, `DB_PASSWORD`). | `config/config.js`, `models/index.js`, `.sequelizerc` |
| `dotenv` נטען בשורה הראשונה. CORS נקבע לפי `CORS_ORIGINS`. HTTPS מופעל לפי `HTTPS=true` ולא לפי `NODE_ENV`. השרת לא עולה בלי `JWT_SECRET`. | `app.js` |
| **התחברות כפולה** (`AUTH_MODE`), ראו סעיף 3. | `src/controllers/auth.js`, `src/routes/auth.js`, `src/middlewares/autth-ntlm.js`, `src/utils/password.js` |
| אופציה `REQUIRE_AUTH=true` מחייבת JWT בכל `/api` חוץ מ-`/api/auth`. כבויה כברירת מחדל כדי לא לשנות את ההתנהגות המקורית. | `app.js` |
| המודל `User` לא מחזיר אף פעם את ה-hash של הסיסמה (`defaultScope`). | `models/user.js` |
| כתובות ה-API של האלפון ושל התמונות עברו ל-`PEOPLE_API_URL` / `PEOPLE_API_COOKIE`. ה-Cookie שהיה בקוד נמחק. בלי הגדרה מוחזרת תשובה ריקה. | `src/controllers/user.controller.js` |
| תוקנו `req`, `res` ו-`path` שלא היו מוגדרים. אפשר להגדיר `FFMPEG_PATH`. | `src/utils/encodeVideo.js` |
| `StorageClass` נקבע לפי `S3_STORAGE_CLASS` (לא נשלח כברירת מחדל). | `file.controller.js`, `courseBatchFolderFile.controller.js` |
| סקריפטים חדשים: `db-init` יוצר את הסכמה מהמודלים (`sequelize.sync()`) ומתקין את ה-triggers מהמיגרציה הקיימת. `seed` יוצר תפקידים, מערכת ומשתמש admin. `create-user` יוצר משתמש או מעדכן סיסמה. | `scripts/` |
| `.env.example` עם כל המשתנים. | `.env.example` |
| תיקיית `logs/` נמחקה (כ-68MB של לוגים מהייצור). | – |

### Frontend (`academix-frontend/`)
| שינוי | קבצים |
|---|---|
| סקריפט שיוצר תמונות placeholder לכל קובץ מדיה חסר (נוצרו 87). הסקריפט **לא דורס** קבצים קיימים. | `scripts/gen-media-placeholders.js`, `src/media/` |
| שני ייבואי ה-CSS החסרים הופנו לקבצים קיימים (לא נעשה בהם שימוש). | `SurveyMembers.tsx`, `EditForm.tsx` |
| הוסר הייבוא של `body-parser`. | `FillInQuestion.tsx` |
| עודכנו גרסאות: `@types/react` / `@types/react-dom` ל-18, `@types/node` ל-20. נוספו `events`, `quill`, `cross-env`. `@types/d3-dispatch` ננעל על 3.0.6 (`overrides`). הוסרו `fs`, `fluent-ffmpeg`, `dotenv`. | `package.json` |
| `"proxy": "http://localhost:8007"`, וגם `.env.development` ו-`.env.example`. | |
| **דף התחברות** (antd, RTL, עברית) ו**כפתור התנתקות** בסרגל העליון (במצב `local` בלבד). | `src/pages/Login/`, `src/App.tsx`, `src/utils/useUserAuth.ts`, `src/services/ntlmService.ts`, `src/store/userStore.ts`, `src/components/layout/Topbar.tsx` |
| הוסר Google Fonts. כתובות שרת התמונות והצ'אט עברו ל-`REACT_APP_PHOTO_API_URL` / `REACT_APP_CHAT_URL`. | `SimpleCalendar.module.css`, `DeleteStudentModal.tsx`, `Topbar.tsx`, `ErrorPage.tsx`, `Photo.tsx` |

### שורש הפרויקט
- `docker-compose.yml`: PostgreSQL 16 ו-MinIO, כולל יצירה אוטומטית של bucket בשם `academix`.
- `README.md`: הוראות הרצה ורשימת בדיקות להחזרה לרשת.
- נמחק `package.json` בשורש (רשימת חבילות שלא היה בה שימוש).

---

## 3. מנגנון ההתחברות

| `AUTH_MODE` | מתי | איך |
|---|---|---|
| `local` | מחוץ לרשת | `POST /api/auth/login` בודק את `Users.password` (hash מסוג scrypt של Node, בלי חבילות נוספות) ומגדיר עוגיות `token` (JWT httpOnly) ו-`userInfo`. |
| `ntlm` | ברשת הסגורה | `GET /api/auth/ntlm` כמו קודם, עם `NTLM_DOMAIN` ו-`NTLM_DOMAIN_CONTROLLER`. במצב הזה `/api/auth/login` לא קיים. |

ה-Frontend קורא את המצב מ-`GET /api/auth/mode`. במצב `local` מוצג דף ההתחברות עד שיש session.

---

## 4. החזרה לרשת הסגורה – מה לעשות

1. התקנת חבילות בלי אינטרנט: להעביר `node_modules` (אותה מערכת הפעלה ואותה גרסת Node) או להשתמש ב-registry פנימי (Verdaccio).
2. ffmpeg: אם מערכת ההפעלה שונה, לספק את קובץ ההרצה ולהגדיר `FFMPEG_PATH`.
3. `.env` של ה-Backend:
   - `AUTH_MODE=ntlm`, `NTLM_DOMAIN`, `NTLM_DOMAIN_CONTROLLER`
   - `HTTPS=true`, `CERT_PATH`, `PASSWORD`
   - `DB_*`: לפי הלוגים, מסד הנתונים הקודם רץ כנראה על פורט **5433**
   - `S3_*`, `CORS_ORIGINS`, `PEOPLE_API_URL`
4. **לא להריץ** `db:init -- --force` על מסד קיים. לעשות קודם `pg_dump`.
5. Build של ה-Frontend עם `REACT_APP_API_BASE_URL`, `REACT_APP_S3_BASE_URL`, `REACT_APP_PHOTO_API_URL` ו-`REACT_APP_CHAT_URL` של הרשת.
6. להחזיר את קבצי המדיה האמיתיים ל-`academix-frontend/src/media/` לפני ה-build.
7. התעודה `certificate/cert.pfx` **לא נמצאת ב-git**. צריך להעתיק אותה ידנית לשרת.

---

## 5. נקודות אבטחה פתוחות (לא תוקנו)
- בלי `REQUIRE_AUTH=true` אף נתיב `/api/*` לא מוגן.
- SQL Injection: `teamId` משולב ישירות בשאילתה ב-`src/controllers/taskAssignment.controller.js` (בערך שורה 1948).
- `errorHandler` מחזיר ללקוח את `error.message`, והקריאות הפנימיות משתמשות ב-`rejectUnauthorized: false`.
- `config/config.json` (סיסמאות ישנות) לא נמצא ב-git ואין בו יותר שימוש. מומלץ למחוק אותו.

## 6. מה נבדק
- כל קבצי ה-Backend עוברים בדיקת תחביר, 48 המודלים נטענים, השרת עולה ונתיבי `/api/auth/*` מגיבים.
- ב-Frontend: `tsc --noEmit` עובר בלי שגיאות ו-`npm run build` מצליח.
- **לא נבדקו:** `db:init`, `db:seed`, התחברות מקצה לקצה והעלאת קבצים. Docker ו-PostgreSQL לא היו זמינים בסביבת העבודה.

</div>
