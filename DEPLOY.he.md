<div dir="rtl">

# Academix – מדריך פריסה ברשת הסגורה

המדריך מתאר צעד אחר צעד איך להעביר את הגרסה שפותחה מחוץ לרשת אל הרשת הסגורה, למזג אותה למאגר ה-GitLab הפנימי ולפרוס אותה בייצור, **בלי לאבד נתונים ועם אפשרות לחזור אחורה**.

המצב היום:
- הפרויקט **רץ בייצור** ברשת הסגורה, והקוד שלו נמצא במאגר **GitLab פנימי**.
- מסד הנתונים (PostgreSQL) ואחסון הקבצים (MinIO / S3) של הייצור **מכילים נתונים אמיתיים**.
- הגרסה החדשה פותחה מחוץ לרשת, ב-GitHub. היא **לא** מכילה את קבצי המדיה האמיתיים (רק תמונות ממלא-מקום בגודל 1×1), את התעודה ואת קבצי ה-`.env` של הייצור.

> **כלל הזהב:** לא נוגעים בייצור לפני שהכול עבד על **עותק** (סעיף 5). בכל שלב שמשהו לא ברור: עוצרים, שומרים את הפלט, ושואלים.

---

## תוכן העניינים
1. [מה השתנה בגרסה הזו (מה שמשפיע על הפריסה)](#1-מה-השתנה-בגרסה-הזו-מה-שמשפיע-על-הפריסה)
2. [הכנה מחוץ לרשת](#2-הכנה-מחוץ-לרשת)
3. [מיזוג הקוד ל-GitLab הפנימי](#3-מיזוג-הקוד-ל-gitlab-הפנימי)
4. [גיבויים](#4-גיבויים)
5. [חזרה גנרלית על עותק](#5-חזרה-גנרלית-על-עותק)
6. [פריסת ה-Backend](#6-פריסת-ה-backend)
7. [עדכון מסד הנתונים](#7-עדכון-מסד-הנתונים)
8. [פריסת ה-Frontend](#8-פריסת-ה-frontend)
9. [בדיקות אחרי הפריסה](#9-בדיקות-אחרי-הפריסה)
10. [חזרה לאחור (Rollback)](#10-חזרה-לאחור-rollback)
11. [מה להחזיר לצוות הפיתוח](#11-מה-להחזיר-לצוות-הפיתוח)

---

## 1. מה השתנה בגרסה הזו (מה שמשפיע על הפריסה)

| נושא | מה השתנה | מה זה דורש בפריסה |
|---|---|---|
| קבצי הקוד | ב-Backend כל הקבצים הם `.js` (לא `.txt`). ההגדרות עברו לקובץ `.env`. | `.env` חדש (סעיף 6.3). **לא** להשתמש יותר ב-`config/config.json`. |
| אימות | כל נתיב `/api` (חוץ מ-`/api/auth`) דורש JWT בעוגייה `token`. הזהות והתפקיד מגיעים רק מהשרת. | `JWT_SECRET` חובה (בלעדיו השרת לא עולה). `REQUIRE_AUTH` ריק או `true`. |
| NTLM | נשאר כמו קודם (`AUTH_MODE=ntlm`). כשה-session פג (ברירת מחדל: 12 שעות), ה-Frontend מתחבר מחדש דרך NTLM בשקט. | לבדוק אחרי הפריסה (סעיף 9). אי אפשר היה לבדוק את זה מחוץ לרשת. |
| HTTPS | כמו קודם, עם תעודת `.pfx`. | `HTTPS=true`, `CERT_PATH`, `PASSWORD`. |
| חבילות npm | ב-Backend נוספו `helmet`, `compression`, `express-rate-limit` והוסרה `request`. ב-Frontend הוסרו כמה חבילות שלא היו בשימוש. | `node_modules` חדשים בשני הצדדים (סעיף 2.3). |
| Node.js | | גרסה **20 ומעלה**. |
| מסד נתונים | נוספו אינדקסים ועמודות. `db:init -- --alter` **רק מוסיף**: אף פעם לא מוחק או משנה עמודה קיימת. | גיבוי, בדיקת כפילויות, `db:init -- --alter` (סעיף 7). |
| העלאת קבצים | מגבלת גודל (ברירת מחדל 2048MB) ורשימת סיומות חסומות (ברירת מחדל: `exe, msi, bat, js, html`…). | לבדוק שהסיומות שהמשתמשים מעלים בפועל לא חסומות (`UPLOAD_BLOCKED_EXTENSIONS`). |
| לוגים | קובץ לכל רמה ולכל יום, בתיקייה `logs/`. בייצור **אין** פלט ל-console. | לוודא הרשאות כתיבה לתיקיית הלוגים (`LOG_DIR`). |
| חיפוש אנשים (annuaire) | תעודת ה-HTTPS של `PEOPLE_API_URL` **נבדקת** עכשיו. | אם היא חתומה ע"י רשות פנימית: `PEOPLE_API_CA_FILE` (סעיף 6.3). |
| Frontend | כתובות השרתים מגיעות ממשתני `REACT_APP_*` בזמן ה-build. הגופן הוחלף ל-woff2. | build מחדש ברשת, עם המדיה האמיתית (סעיף 8). |

כל Pull Request ב-GitHub כולל סעיף "Closed-network deployment impact". אם משהו לא ברור, שם מופיע הפירוט.

---

## 2. הכנה מחוץ לרשת

### 2.1 לברר קודם ברשת הסגורה
לפני שמכינים משהו, לברר על שרת הייצור (ולרשום):
- מערכת ההפעלה (Windows / Linux) והארכיטקטורה (x64).
- גרסת Node.js: `node -v` (צריך 20 ומעלה). אם הגרסה ישנה יותר, להכין גם מתקין של Node 20 LTS.
- האם יש **registry פנימי של npm** (Nexus, Artifactory, Verdaccio…).
- **איך** ה-Backend רץ היום: שירות Windows, PM2, NSSM, משימה מתוזמנת, חלון פתוח…
- **איך** ה-Frontend מוגש: IIS, nginx, Apache, או תיקייה סטטית אחרת. ובאיזו כתובת.
- איפה נמצאים היום ה-`.env` / `config.json`, התעודה (`.pfx`) והלוגים.

### 2.2 לייצא את הקוד (בלי המדיה)
במחשב עם גישה ל-GitHub:

```bash
git clone https://github.com/nathanebar/academix.git
cd academix
git checkout main
git log -1 --format="%h %ad %s"     # לרשום את מזהה ה-commit שמייצאים

# ארכיון של הקוד, בלי תיקיית המדיה (ב-GitHub יש בה רק תמונות ממלא-מקום)
git archive --format=tar.gz -o academix-code.tar.gz HEAD -- . ":(exclude)academix-frontend/src/media"
```

> **חשוב:** לעולם לא להעתיק את `academix-frontend/src/media` מ-GitHub אל הרשת. התמונות האמיתיות נמצאות רק ב-GitLab הפנימי, והעתקה תדרוס אותן בריבועים אפורים. (נכון לגרסה הזו, לא נוספה שום תמונה חדשה מחוץ לרשת. אם בעתיד תתווסף, היא תועבר בנפרד.)

> משתמשים ב-`tar.gz` ולא ב-zip: `git archive` ו-`tar` קיימים גם ב-Linux וגם ב-Windows (Git Bash / Windows 10 ומעלה), ו-`zip` לא תמיד מותקן.

### 2.3 תלויות (node_modules)
**אפשרות א' – יש registry פנימי:** לבדוק שהחבילות החדשות זמינות בו (`helmet`, `compression`, `express-rate-limit` והתלויות שלהן). קבצי `package-lock.json` מגדירים את הגרסאות המדויקות. במקרה הזה אין צורך להעביר `node_modules`.

**אפשרות ב' – אין registry:** להכין `node_modules` במחשב עם **אותה מערכת הפעלה ואותה גרסה ראשית של Node** כמו שרת הייצור:

```bash
cd academix-backend
npm ci --omit=dev          # רק מה שצריך להרצה
cd ../academix-frontend
npm ci                      # ה-build צריך גם את כלי הפיתוח
cd ..
# לארוז כל תיקייה בנפרד
tar -czf node_modules-backend.tar.gz  academix-backend/node_modules
tar -czf node_modules-frontend.tar.gz academix-frontend/node_modules
```

> `@ffmpeg-installer` מוריד קובץ ffmpeg למערכת ההפעלה שבה רץ `npm ci`. אם המערכת שונה מהשרת: להביא קובץ ffmpeg מתאים ולהגדיר `FFMPEG_PATH`.

### 2.4 טביעת אצבע ומסירה
```bash
sha256sum academix-code.tar.gz node_modules-*.tar.gz > SHA256SUMS.txt
```
להעביר את הקבצים לרשת לפי **הנוהל המאושר להעברת קבצים**, כולל `SHA256SUMS.txt`. בצד השני לוודא: `sha256sum -c SHA256SUMS.txt`.

---

## 3. מיזוג הקוד ל-GitLab הפנימי

הפקודות כתובות ל-bash. ב-Windows אפשר להריץ אותן ב-**Git Bash**, שמגיע עם Git for Windows.

### 3.1 לבדוק אם הקוד ב-GitLab השתנה מאז שהוצא
```bash
git clone <כתובת המאגר ב-GitLab> academix-gitlab
cd academix-gitlab
git checkout main
git log --since="<התאריך שבו הקוד הוצא מהרשת>" --format="%h %ad %an %s" --date=short
```
- **אין commits:** ממשיכים.
- **יש commits:** אלו שינויים שנעשו בייצור אחרי שהקוד הוצא, והגרסה החדשה לא מכירה אותם. לרשום אותם (`git show <hash>`). אחרי שלב 3.3 צריך להחיל אותם מחדש ידנית, ולספר לצוות הפיתוח כדי שיוכנסו גם ל-GitHub.

### 3.2 ענף חדש
```bash
git checkout -b release/academix-v2 main
```
> לא עובדים ישירות על `main`, ולא עושים force-push.

### 3.3 להחליף את הקוד, ולשמור את המדיה
```bash
# 1. למחוק את כל קבצי העבודה, חוץ מתיקיית .git (המדיה חוזרת בשלב 3)
find . -mindepth 1 -maxdepth 1 ! -name .git -exec rm -rf {} +
# 2. לפרוס את הקוד החדש
tar -xzf /path/to/academix-code.tar.gz -C .
# 3. להחזיר את המדיה האמיתית מ-main
git checkout main -- academix-frontend/src/media
# 4. להכניס את הכול: git רושם גם את הקבצים שנמחקו
git add -A
```

### 3.4 לבדוק לפני commit
```bash
git status --short | grep 'src/media' | head        # צריך להיות ריק: המדיה לא השתנתה
git status --short | grep -E '\.env$|\.pfx$|config\.json$|node_modules'   # צריך להיות ריק
git diff --cached --stat | tail -1                   # כמה קבצים השתנו
git diff --cached --name-status --diff-filter=D      # הקבצים שנמחקו: לעבור עליהם
```
קבצים שנמחקים, וזה צפוי: קוד מת שהוסר (למשל `forms.routes.js`, `validateUser.js`), `config/config.json` אם היה במאגר (הסיסמאות שבו לא בשימוש יותר), וקבצי לוג ישנים. **קובץ אחר שנמחק = לעצור ולבדוק.**

> אם ב-3.1 נמצאו commits חדשים ב-GitLab: להחיל עכשיו את השינויים שלהם על הקבצים החדשים, ידנית.

### 3.5 Commit, Merge Request, תגית
```bash
git commit -m "Academix v2: changes developed outside the network (GitHub <commit>)"
git push -u origin release/academix-v2
```
לפתוח Merge Request אל `main`, לעבור על השינויים, למזג. אחר כך:
```bash
git checkout main && git pull
git tag academix-v2 && git push origin academix-v2
```
**מעכשיו, הפריסה נעשית מהתגית `academix-v2`.**

---

## 4. גיבויים

לפני כל נגיעה בייצור:

1. **מסד הנתונים:**
   ```bash
   pg_dump -h <host> -p <port> -U <user> -Fc -f academix-before-v2.dump <db_name>
   pg_restore -l academix-before-v2.dump | head      # לוודא שהקובץ תקין וקריא
   ```
   לשמור את הקובץ **מחוץ** לשרת מסד הנתונים.
2. **הקוד הנוכחי של ה-Backend:** להעתיק את כל התיקייה כמו שהיא (כולל `node_modules`, `config.json` / `.env` ו-`certificate`), למשל ל-`academix-backend-before-v2`.
3. **ה-Frontend הנוכחי:** להעתיק את תיקיית הקבצים הסטטיים שמוגשת היום.
4. **MinIO:** הגרסה לא משנה את מבנה האחסון. גיבוי לא חובה, אבל אם יש נוהל גיבוי, זה הזמן.
5. לרשום **איך** מפעילים ומפסיקים היום את ה-Backend (שירות, PM2…) ואת הגדרות שרת ה-web של ה-Frontend.

---

## 5. חזרה גנרלית על עותק

המטרה: להריץ את כל שלבי הפריסה על **עותק** של מסד הייצור, כדי לגלות בעיות בלי סיכון.

1. ליצור מסד בדיקה מהגיבוי:
   ```bash
   createdb -h <host> -p <port> -U <user> academix_rehearsal
   pg_restore -h <host> -p <port> -U <user> -d academix_rehearsal --no-owner academix-before-v2.dump
   ```
2. להכין את ה-Backend החדש בתיקייה נפרדת (סעיפים 6.1–6.4), עם `.env` שמצביע על:
   - `DB_NAME=academix_rehearsal`
   - `PORT` אחר (למשל `8017`), כדי לא להתנגש עם הייצור.
   - **אחסון:** `S3_BUCKET_NAME` של bucket **בדיקה** (העתק), או להשאיר את ה-bucket של הייצור ו**לא למחוק ולא להעלות שום קובץ** במהלך החזרה. מחיקת משימה / טופס בעותק **מוחקת את הקבצים שלה ב-MinIO**, גם בייצור.
3. להריץ את סעיף 7 על העותק, ולשמור את כל הפלטים.
4. להפעיל את ה-Backend על העותק, לבנות Frontend שמצביע עליו (`REACT_APP_API_BASE_URL` עם הפורט של החזרה), ולעבור על הבדיקות של סעיף 9 (בלי העלאה ובלי מחיקה, אם ה-bucket הוא של הייצור).
5. רק כשהכול עובר: ממשיכים לייצור. בסוף אפשר למחוק את מסד הבדיקה: `dropdb academix_rehearsal`.

---

## 6. פריסת ה-Backend

### 6.1 קוד
להוציא את התגית לתיקייה **חדשה** (לא לדרוס את הישנה, היא הגיבוי):
```bash
git clone --branch academix-v2 <כתובת המאגר ב-GitLab> academix-v2
```

### 6.2 תלויות
- registry פנימי: `cd academix-v2/academix-backend && npm ci --omit=dev`
- אחרת: מתוך `academix-v2/`: `tar -xzf /path/to/node_modules-backend.tar.gz` (יוצר את `academix-backend/node_modules`).

בדיקה: `node -e "require('helmet'); require('compression'); require('express-rate-limit'); console.log('ok')"` מתוך `academix-backend`.

### 6.3 קובץ `.env`
להעתיק את `academix-backend/.env.example` ל-`academix-backend/.env` ולמלא את ערכי הייצור. **לא** להעתיק את `config.json` הישן. הערכים מ-`config.json` (מסד נתונים, S3) עוברים למשתנים המתאימים.

| משתנה | ערך בייצור |
|---|---|
| `NODE_ENV` | `production` |
| `PORT` | הפורט של היום (כנראה `8007`) |
| `HTTPS` / `CERT_PATH` / `PASSWORD` | `true` / נתיב ל-`.pfx` / הסיסמה של התעודה |
| `CORS_ORIGINS` | הכתובת המלאה של ה-Frontend, למשל `https://academix.intranet` (כמה כתובות: מופרדות בפסיק) |
| `TRUST_PROXY` | `1` אם יש reverse proxy (IIS / nginx) לפני ה-API, אחרת ריק |
| `AUTH_MODE` | `ntlm` |
| `NTLM_DOMAIN` / `NTLM_DOMAIN_CONTROLLER` | הדומיין ובקרי הדומיין, למשל `ldap://dc1.domain.local,ldap://dc2.domain.local` |
| `JWT_SECRET` | מחרוזת אקראית ארוכה וחדשה (פקודה למטה). **לא לשתף ולא להכניס ל-git.** |
| `JWT_EXPIRES_IN` | `12h` (או לפי מדיניות) |
| `REQUIRE_AUTH` | `true` (**לעולם לא `false` בייצור**) |
| `DB_HOST` / `DB_PORT` / `DB_NAME` / `DB_USER` / `DB_PASSWORD` | מסד הייצור (לפי הלוגים הישנים, כנראה פורט `5433`) |
| `DB_POOL_MAX` | `20` (ברירת מחדל). מספר תהליכי Node × הערך < `max_connections` של PostgreSQL |
| `S3_ENDPOINT` / `S3_ACCESS_KEY` / `S3_SECRET_KEY` / `S3_BUCKET_NAME` | ה-MinIO של הייצור |
| `S3_STORAGE_CLASS` | `STANDARD_IA` אם זה היה המצב קודם, אחרת ריק |
| `UPLOAD_MAX_FILE_SIZE_MB` / `UPLOAD_TMP_DIR` | לפי הצורך. בתיקייה הזמנית צריך מקום פנוי לקובץ הגדול ביותר |
| `UPLOAD_BLOCKED_EXTENSIONS` | להשאיר לא מוגדר (ברירת מחדל בטוחה), אלא אם המשתמשים צריכים סיומת חסומה |
| `LOG_DIR` / `LOG_RETENTION_DAYS` | תיקייה עם הרשאות כתיבה / `30` |
| `FFMPEG_PATH` | רק אם `@ffmpeg-installer` לא מתאים למערכת ההפעלה |
| `PEOPLE_API_URL` / `PEOPLE_API_COOKIE` | API האנשים הפנימי. להשתמש בחשבון שירות, **לא** בעוגייה הישנה שהייתה כתובה בקוד |
| `PEOPLE_API_CA_FILE` | נתיב לתעודת הרשות הפנימית (PEM), אם תעודת ה-API חתומה על ידה |
| `PEOPLE_API_INSECURE_TLS` | `false`. `true` רק כמוצא אחרון, אם אין דרך לקבל את תעודת הרשות |

יצירת `JWT_SECRET`:
```bash
node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"
```

### 6.4 תעודה
להעתיק את קובץ ה-`.pfx` הקיים לנתיב שב-`CERT_PATH` (ברירת מחדל: `academix-backend/certificate/cert.pfx`). התעודה **לא** נכנסת ל-git.

---

## 7. עדכון מסד הנתונים

לעשות בחלון תחזוקה, **אחרי שה-Backend הישן הופסק**. יצירת אינדקסים על טבלאות גדולות יכולה לקחת זמן ונועלת כתיבה לטבלה.

מתוך `academix-v2/academix-backend`:

1. **בדיקת כפילויות (קריאה בלבד, לא משנה כלום):**
   ```bash
   npm run db:check-duplicates > check-duplicates.txt 2>&1
   ```
   לשמור את הקובץ. הוא נועד לצוות הפיתוח (סעיף 11), ולא עוצר את הפריסה.
2. **עדכון הסכמה:**
   ```bash
   npm run db:init -- --alter > db-init.txt 2>&1
   ```
   הפקודה יוצרת טבלאות חסרות, מוסיפה עמודות, אינדקסים וערכי enum חסרים, ומתקינה מחדש את ה-triggers. היא **לא** מוחקת ולא משנה עמודה קיימת.

   פלט תקין מסתיים ב:
   ```
   Schema synced (48 models)
   Role-assignment triggers installed
   ```
3. **אם יש שגיאה:** לעצור, לשמור את `db-init.txt`.
   - `could not create unique index` = יש כפילויות בטבלה (למשל `TeamAxisOrders`, `Domains.name`). לא לנסות לתקן ידנית: להעביר את הפלט לצוות הפיתוח.
   - הפקודה רק מוסיפה, ולכן אפשר להריץ אותה שוב אחרי תיקון. במקרה הצורך: חזרה לאחור (סעיף 10).

> **אסור** להריץ בייצור `db:init -- --force` (מוחק את כל הטבלאות) או `db:init -- --alter-full` (מוחק עמודות). אין גם צורך ב-`db:seed`: התפקידים כבר קיימים.

---

## 8. פריסת ה-Frontend

הקבצים נבנים **ברשת**, כי ה-build צריך את המדיה האמיתית.

1. **מדיה:** לוודא שב-`academix-frontend/src/media/` נמצאות התמונות האמיתיות (מה-GitLab, לא ריבועים אפורים). **לא** להריץ `npm run media:placeholders` בייצור.
2. **תלויות:** `npm ci` (registry פנימי), או מתוך `academix-v2/`: `tar -xzf /path/to/node_modules-frontend.tar.gz`.
3. **משתני סביבה:** ליצור `academix-frontend/.env.production.local` (לא נכנס ל-git):
   ```
   REACT_APP_API_BASE_URL=https://<שרת ה-API>:8007/api
   REACT_APP_S3_BASE_URL=https://<שרת ה-MinIO>
   REACT_APP_S3_BUCKET=<שם ה-bucket>
   REACT_APP_PHOTO_API_URL=<שירות התמונות, אופציונלי>
   REACT_APP_CHAT_URL=<קישור הצ'אט, אופציונלי>
   ```
   כש-ה-Frontend וה-API מוגשים מאותה כתובת דרך reverse proxy: `REACT_APP_API_BASE_URL=/api`.
4. **Build:**
   ```bash
   npm run build:prod
   ```
   התוצאה בתיקייה `academix-frontend/build/`.
5. **הגשה:** להחליף את התוכן שמוגש היום בתוכן של `build/` (אחרי הגיבוי של סעיף 4).
   - שרת ה-web צריך להחזיר `index.html` לכל נתיב שלא קיים כקובץ (ניתוב בצד הלקוח, כמו היום).
   - העוגייה `userInfo` צריכה להיות קריאה ל-Frontend: להגיש את ה-Frontend ואת ה-API מאותו host, או מאחורי reverse proxy, כמו היום.
   - אפשר להגדיר cache ארוך לקבצים שב-`build/static/` (בשמות שלהם יש hash), ו-**בלי cache** ל-`index.html`.

---

## 9. בדיקות אחרי הפריסה

**השרת:**
- [ ] בלוג (`logs/`) מופיע `Server is running on port 8007 (https)`, בלי שגיאות.
- [ ] `https://<שרת ה-API>:8007/api/auth/mode` מחזיר `{"mode":"ntlm"}`.
- [ ] בקשה ל-`/api/...` בלי התחברות מחזירה `401`.

**משתמשים (עם כמה תפקידים: מנהל, מפקד קורס, מפקד צוות, חניך):**
- [ ] כניסה אוטומטית דרך NTLM, השם והתפקיד הנכונים מוצגים.
- [ ] מעבר בין תפקידים (למי שיש כמה) מציג את הנתונים של התפקיד שנבחר.
- [ ] כל אחד רואה רק את הדומיינים / הקורסים / הצוותים שלו.
- [ ] לוח שנה, משימות, טפסים, משובים, מחברת, דשבורד מחזור, לומדה (כל השקפים מוצגים).
- [ ] העלאת קובץ, הורדה וצפייה (PDF, וידאו).
- [ ] חיפוש אנשים ותמונות פרופיל.
- [ ] הטקסט מוצג בגופן של האתר (עברית, מספרים, אותיות לטיניות).
- [ ] ב-DevTools (F12) → Network: אין בקשות אדומות (4xx / 5xx) בשימוש רגיל.

**חידוש session:**
- [ ] אחרי שה-session פג (אפשר לבדוק עם `JWT_EXPIRES_IN=5m` זמנית, ואז להחזיר), הפעולה הבאה עובדת בלי חלון התחברות: ה-Frontend מתחבר מחדש דרך NTLM.

---

## 10. חזרה לאחור (Rollback)

אם משהו חמור לא עובד ואין פתרון מהיר:

1. להפסיק את ה-Backend החדש.
2. להפעיל את ה-Backend הישן מהתיקייה ששמרנו (סעיף 4.2), בדיוק כמו קודם.
3. להחזיר את קבצי ה-Frontend הישנים (סעיף 4.3).
4. **מסד הנתונים:** השינויים של `db:init -- --alter` רק מוסיפים (עמודות, אינדקסים), והגרסה הישנה מתעלמת מהם. **בדרך כלל אין צורך לשחזר.** לשחזר את הגיבוי רק אם הנתונים עצמם נפגעו, ובידיעה שכל מה שנכתב מאז הפריסה יאבד:
   ```bash
   pg_restore -h <host> -p <port> -U <user> -d <db_name> --clean --if-exists --no-owner academix-before-v2.dump
   ```
5. לשמור את הלוגים ואת הפלטים, ולהעביר לצוות הפיתוח.

---

## 11. מה להחזיר לצוות הפיתוח

לפי נהלי הרשת, ורק מידע שמותר להוציא (בלי נתונים אישיים, סיסמאות או כתובות פנימיות):
- הפלט של `npm run db:check-duplicates` (מכיל רק מזהים ומספרים). לפיו נכתב הניקוי של issue #35.
- הפלט של `npm run db:init -- --alter`, אם הייתה שגיאה.
- כל שגיאה שנמצאה בבדיקות של סעיף 9, עם הנתיב (URL) וקוד השגיאה.
- רשימת ה-commits שנמצאו ב-GitLab בשלב 3.1, אם היו.
- גרסת Node ומערכת ההפעלה של השרת.

</div>
