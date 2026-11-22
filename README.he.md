<div dir="rtl">

# Academix

[English](README.md) · **עברית**

Academix היא מערכת לניהול קורסים והכשרות (בדומה ל-Moodle), עם ממשק בעברית מימין לשמאל.

> **מקור ומטרה.** Academix מגיעה מ**רשת אוניברסיטאית סגורה ללא גישה לאינטרנט**. הפיתוח והשיפורים נעשים מחוץ לרשת הזו, והמטרה היא **לפרוס אותה שם מחדש** בסיום השינויים. לכן כל מה שנמצא במאגר הזה חייב להמשיך לעבוד בלי אינטרנט: ראו [פריסה מחדש ברשת הסגורה](#פריסה-מחדש-ברשת-הסגורה).

## מבנה המאגר

| נתיב | תוכן |
|---|---|
| `academix-backend/` | REST API: ‏Express 5 + Sequelize 6 ‏(PostgreSQL), אחסון קבצים ב-S3 / MinIO, אימות NTLM **או** שם משתמש וסיסמה |
| `academix-frontend/` | אפליקציית ווב: React 18 + TypeScript ‏(Create React App), ‏Ant Design 5, ‏TanStack Query, ‏Zustand |
| `docker-compose.yml` | תשתית מקומית לפיתוח: PostgreSQL 16 + MinIO |
| `CLAUDE.md` | כללי עבודה משותפת (אזורי אחריות, תהליך git, אילוצי הרשת הסגורה) |
| `RAPPORT.he.md` | סקירה מלאה של הפרויקט ומפת דרכים לשיפור ביצועים |

## הרצה מקומית (מחוץ לרשת הסגורה)

דרישות: Node.js בגרסה 20 ומעלה, Docker Desktop.

</div>

```bash
# 1. Infrastructure
docker compose up -d            # Postgres :5432, MinIO :9000 (console :9001, minioadmin / minioadmin)

# 2. Backend
cd academix-backend
cp .env.example .env            # then set a random JWT_SECRET
npm ci
npm run db:init                 # creates every table from the models, plus the triggers
npm run db:seed                 # roles, "Academix" system, admin / admin user (SYSTEM-ADMIN)
npm run dev                     # http://localhost:8007

# 3. Frontend (another terminal)
cd academix-frontend
npm ci                          # .env.development is already provided
npm start                       # http://localhost:3000 -> login page
```

<div dir="rtl">

- ב-`.env` של ה-Backend יש להגדיר `JWT_SECRET` אקראי.
- `db:init` יוצר את כל הטבלאות מתוך ה-models, כולל ה-triggers. ‏`db:seed` יוצר את התפקידים, את המערכת "Academix" ואת המשתמש `admin` / `admin` ‏(SYSTEM-ADMIN).
- ה-Frontend זמין בכתובת `http://localhost:3000` ומציג את דף הכניסה.

יצירת משתמשים נוספים: `npm run user:create -- <username> <password> [name] [militaryid]` (בתוך `academix-backend/`).

### פורטים של התשתית

אם פורט כבר תפוס (למשל PostgreSQL שמותקן ב-Windows מאזין כבר על 5432), יש ליצור קובץ `.env` בשורש המאגר (git מתעלם ממנו):

</div>

```bash
POSTGRES_PORT=5433
MINIO_PORT=9000
MINIO_CONSOLE_PORT=9001
```

<div dir="rtl">

ולהשתמש באותם ערכים ב-`academix-backend/.env` ‏(`DB_PORT=5433`, ‏`S3_ENDPOINT=http://localhost:<MINIO_PORT>`), ואם `MINIO_PORT` משתנה, גם ב-`REACT_APP_S3_BASE_URL` של ה-Frontend ‏(`academix-frontend/.env.development.local`).

ה-image של MinIO הוא `cgr.dev/chainguard/minio`, מקובע לפי digest ב-`docker-compose.yml`: ‏`minio/minio` ו-`minio/mc` כבר לא מתפרסמים ב-Docker Hub.

### אימות

| `AUTH_MODE` | שימוש | אופן פעולה |
|---|---|---|
| `local` | מחוץ לרשת הסגורה (פיתוח) | ‏`POST /api/auth/login` בודק את `Users.password` (hash מסוג scrypt של Node) ומגדיר את העוגיות `token` ‏(JWT מסוג httpOnly) ו-`userInfo`. ה-Frontend מציג דף כניסה וכפתור יציאה. |
| `ntlm` | ברשת הסגורה | ‏`GET /api/auth/ntlm` ‏(express-ntlm עם `NTLM_DOMAIN` / `NTLM_DOMAIN_CONTROLLER`), ההתנהגות המקורית. במצב הזה `/api/auth/login` לא קיים. |

ה-Frontend קורא את המצב דרך `GET /api/auth/mode`. ‏`REQUIRE_AUTH=true` מחייב JWT תקין בכל נתיבי `/api`. ברירת המחדל כבויה, כדי לא לשנות את ההתנהגות המקורית.

### בסיס נתונים

המיגרציות ב-`academix-backend/migrations/` **לא עקביות**: הטבלה `TeamCourseBatches` אף פעם לא נוצרת, חלק מהמפתחות הזרים מפנים לטבלאות שנוצרות מאוחר יותר, ויש כפילויות, חותמות זמן לא תקינות וטבלאות חסרות. לכן הסכמה נוצרת באמצעות `npm run db:init` ‏(`sequelize.sync()` מתוך ה-models).

| פקודה | השפעה |
|---|---|
| `npm run db:init` | יוצרת רק את הטבלאות החסרות |
| `npm run db:init -- --alter` | מתאימה את הטבלאות הקיימות ל-models (להריץ אחרי משיכת שינויים במודלים) |
| `npm run db:init -- --force` | **מוחקת ויוצרת מחדש את כל הטבלאות**. אסור להריץ על בסיס נתונים משותף או של ייצור |

### מדיה

התיקייה `academix-frontend/src/media/` לא חולצה במלואה. ‏`npm run media:placeholders` (בתוך `academix-frontend/`) יוצר תמונות ניטרליות בנתיבים הצפויים (87 קבצים). הוא אף פעם לא דורס קובץ קיים, כך שמספיק להעתיק את המדיה האמיתית מעליהם.

## עבודה משותפת

שני מפתחים עובדים במקביל, כל אחד עם סשן Claude Code משלו. הכללים נמצאים ב-[`CLAUDE.md`](CLAUDE.md). בקצרה:

- ה-Backend וקבצי השורש: ‏@nathanebar. ה-Frontend: ‏@shneorshr1. כל אחד עורך רק את האזור שלו.
- משימה אחת = issue אחד ב-GitHub = branch אחד (`be/<topic>` או `fe/<topic>`) = pull request קטן אחד. ‏`main` מוגן.
- תוכנית העבודה מנוהלת ב-issue המוצמד [#23](https://github.com/nathanebar/academix/issues/23).

## פריסה מחדש ברשת הסגורה

אין ליעד **גישה לאינטרנט**: צריך להכניס אליו את כל מה שהוא צריך.

1. **תלויות בלי אינטרנט**: להעביר את `node_modules` (אותה מערכת הפעלה ואותה גרסת Node כמו ביעד), או cache של npm / רישום פנימי (Verdaccio). עבור ה-Frontend אפשר גם להעביר רק את התיקייה `build/`. ‏Docker משמש רק לפיתוח מקומי, והיעד לא צריך אותו.
2. **ffmpeg**: ‏`@ffmpeg-installer` כולל קובץ הרצה למערכת הפעלה אחת. אם הפלטפורמה שונה, יש לספק את קובץ ההרצה ולהגדיר `FFMPEG_PATH`.
3. **‏`.env` של ה-Backend**:
   - `NODE_ENV=production`
   - `AUTH_MODE=ntlm`, ‏`NTLM_DOMAIN`, ‏`NTLM_DOMAIN_CONTROLLER`
   - `HTTPS=true`, ‏`CERT_PATH=certificate/cert.pfx`, ‏`PASSWORD=<passphrase>`
   - `DB_*`: לפי הלוגים, בסיס הנתונים הישן רץ כנראה על פורט **5433**
   - `S3_*` (ובנוסף `S3_STORAGE_CLASS=STANDARD_IA` אם כך היה בעבר)
   - `CORS_ORIGINS=<כתובת ה-Frontend>`
   - `PEOPLE_API_URL` / `PEOPLE_API_COOKIE` לחיפוש באלפון (להשתמש בחשבון שירות, ולא בעוגייה שהייתה כתובה בקוד)
   - תעודת ה-API של האלפון: מעכשיו היא **נבדקת**. אם היא חתומה על ידי רשות פנימית, להגדיר `PEOPLE_API_CA_FILE=<תעודת הרשות, PEM>` (או `NODE_EXTRA_CA_CERTS`). רק אם אי אפשר לספק את תעודת הרשות, ‏`PEOPLE_API_INSECURE_TLS=true` מחזיר את ההתנהגות הישנה (בלי בדיקה). לוודא אחרי הפריסה שחיפוש המשתמשים והתמונות עובדים.
4. **בסיס נתונים קיים**: קודם לבצע `pg_dump`. לעולם לא להריץ `db:init -- --force`. ‏`db:init` בלי אפשרויות יוצר רק טבלאות חסרות; ‏`db:init -- --alter` מחיל שינויים במודלים.
5. **Frontend**: לבנות עם המשתנים של היעד, לדוגמה:

</div>

```bash
REACT_APP_API_BASE_URL=https://<api>:8007/api REACT_APP_S3_BASE_URL=https://<minio> REACT_APP_PHOTO_API_URL=... REACT_APP_CHAT_URL=... npm run build:prod
```

<div dir="rtl">

&nbsp;&nbsp;&nbsp;&nbsp;העוגייה `userInfo` חייבת להיות קריאה ל-Frontend: להגיש את ה-Frontend ואת ה-API מאותו host, או מאחורי reverse proxy.

6. להחזיר את המדיה האמיתית ל-`academix-frontend/src/media/` לפני הבנייה.
7. להשתמש ב-`.env` נקי ביעד. לא להשתמש ב-`config/config.json`: הוא מכיל סיסמאות ישנות וכבר לא בשימוש.
8. לעבור על ה-pull requests שמוזגו מאז הפריסה האחרונה: בכל אחד יש סעיף "Closed-network deployment impact" עם הצעדים הנוספים שהוא דורש (משתנים חדשים, קבצי הרצה, צעדים בבסיס הנתונים).

## בעיות אבטחה ידועות (עדיין לא תוקנו)

מנוהלות בתוכנית העבודה ([#23](https://github.com/nathanebar/academix/issues/23)):

- בלי `REQUIRE_AUTH=true`, אף נתיב `/api/*` לא דורש אימות, וזהות המשתמש נלקחת מכותרות שהלקוח שולח ([#13](https://github.com/nathanebar/academix/issues/13)).
- הזרקת SQL אפשרית: ‏`teamId` משורשר לשאילתה ב-`src/controllers/taskAssignment.controller.js` (בערך שורה 1948) ([#8](https://github.com/nathanebar/academix/issues/8)).
- ‏`errorHandler` מחזיר `error.message` ללקוח; קריאות HTTPS פנימיות משתמשות ב-`rejectUnauthorized: false` ([#15](https://github.com/nathanebar/academix/issues/15)).
- לוגים מהייצור (`academix-backend/logs/`, ‏git מתעלם מהם) מכילים כתובות IP, שמות משתמשים ותוכן בקשות: למחוק אותם לפני שמשתפים משהו.

</div>
