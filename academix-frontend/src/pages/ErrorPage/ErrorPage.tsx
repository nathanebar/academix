import { useEffect, useState } from 'react';
import styles from './ErrorPage.module.css';
import hiChatLogo from "../../media/icons/hiChatLogo.png";

const HI_CHAT_URL = process.env.REACT_APP_CHAT_URL || "#";

type UserInfo = { name?: string; username?: string } | null;

interface ErrorPageProps {
  code?: number | string;
}

export default function ErrorPage({ code: codeProp }: ErrorPageProps) {
  const [code] = useState<number | string>(() => {
    const ds = document.documentElement.dataset;
    return codeProp ?? (ds.code ? Number(ds.code) || ds.code : 404);
  });
  const [path] = useState<string>(() => {
    try {
      return decodeURI(location.pathname + location.search);
    } catch {
      return location.pathname + location.search;
    }
  });
  const [time] = useState<string>(() => {
    const pad = (n: number) => String(n).padStart(2, '0');
    const now = new Date();
    return `${pad(now.getDate())}.${pad(now.getMonth() + 1)}.${now.getFullYear()} ${pad(now.getHours())}:${pad(now.getMinutes())}:${pad(now.getSeconds())}`;
  });
  const [user, setUser] = useState<UserInfo>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    try {
      const raw = localStorage.getItem('userInfo');
      if (raw) setUser(JSON.parse(raw));
    } catch (_) { }
  }, []);

  const displayName = user
    ? user.username
      ? `${user.name} (${user.username})`
      : user.name || 'לא ידוע'
    : 'לא ידוע';

  const copyText = [
    '✉️ דיווח תקלה — אקדמיקס ✉️',
    '',
    'היי! נתקלתי בתקלה במערכת ואשמח לקבל עזרה 🙏',
    '\n',
    `משתמש: ${displayName}`,
    `קוד שגיאה: ${code}`,
    `זמן האירוע: ${time}`,
    `מיקום בדף: ${document.title}`,
    `כתובת באתר: ${path}`,
    `קישור מלא: ${location.href}`,
    '\n',
    'בתודה ובהערכה,',
    `${displayName}`,
  ]
    .filter(Boolean)
    .join('\n');

  const handleCopy = async () => {
    let ok = false;
    try {
      await navigator.clipboard.writeText(copyText);
      ok = true;
    } catch {
      const t = document.createElement('textarea');
      t.value = copyText;
      t.style.position = 'fixed';
      t.style.opacity = '0';
      document.body.appendChild(t);
      t.select();
      try { ok = document.execCommand('copy'); } catch (_) { }
      t.remove();
    }
    setCopied(ok);
    window.setTimeout(() => setCopied(false), 2200);
  };


  return (
    <div className={styles.errPage}>
      <main className={styles.frame}>
        {/* מימין (RTL) — הטקסט */}
        <section className={styles.copy} aria-labelledby="t">
          <span className={styles.eyebrow}><i></i>שגיאה {code} · תקלה במערכת</span>
          <h1 id="t" className={styles.h1}>
            טעויות הן חלק מתהליך הלמידה.
            <span className={styles.ours}>זו הייתה שלנו.</span>
          </h1>
          <p className={styles.lead}>
            שלום, <b className={styles.greetName}>{user?.name || '...'} 👋</b><br />
            העמוד לא נטען בגלל תקלה אצלנו, לא בגלל משהו שעשית. <br />
            צוות הפיתוח כבר לומד ממנה ומתקן.
          </p>

          <div className={styles.todo}>
            <h2>מה עושים בינתיים?</h2>
            <ol>
              <li><p><b>לרענן את העמוד.</b> <span>לפעמים זה כל מה שצריך.</span></p></li>
              <li><p><b>לחזור לדף הבית</b> <span>ולנסות להגיע לעמוד שוב.</span></p></li>
              <li className={styles.contact}>
                <p><b>עדיין לא עובד? לפנות לצוות הפיתוח</b></p>
                <a className={styles.chatLink} href={HI_CHAT_URL} target="_blank" rel="noopener noreferrer">
                  פתיחת קבוצת האקדמיקס ב-HI Chat →
                </a>
              </li>
            </ol>

            <div className={styles.details}>
              <div className={styles.dwrap}>
                <p className={styles.dcap}>כדאי לצרף לפנייה</p>
                <dl className={styles.dl}>
                  <div><dt className={styles.dt}>משתמש</dt><dd className={styles.dd}>{displayName}</dd></div>
                  <div><dt className={styles.dt}>קוד</dt><dd className={styles.dd}>{code}</dd></div>
                  <div><dt className={styles.dt}>זמן</dt><dd className={styles.dd}>{time}</dd></div>
                  <div><dt className={styles.dt}>כתובת</dt><dd className={styles.dd} title={path}>{path}</dd></div>
                </dl>
              </div>
              <button
                className={copied ? `${styles.copyBtn} ${styles.copyBtnOk}` : styles.copyBtn}
                type="button"
                onClick={handleCopy}
              >
                <svg className={styles.ic} width="15" height="15" viewBox="0 0 256 256" fill="currentColor" aria-hidden="true">
                  <path d="M216,32H88a8,8,0,0,0-8,8V80H40a8,8,0,0,0-8,8V216a8,8,0,0,0,8,8H168a8,8,0,0,0,8-8V176h40a8,8,0,0,0,8-8V40A8,8,0,0,0,216,32ZM160,208H48V96H160Zm48-48H176V88a8,8,0,0,0-8-8H96V48H208Z" />
                </svg>
                <span>{copied ? 'הועתק' : 'העתקת הפרטים'}</span>
              </button>
            </div>
          </div>

          <div className={styles.actions}>
            <a className={`${styles.btn} ${styles.primary}`} href="/">
              <svg className={styles.ic} width="18" height="18" viewBox="0 0 256 256" fill="currentColor" aria-hidden="true">
                <path d="M221.66,133.66l-72,72a8,8,0,0,1-11.32-11.32L196.69,136H40a8,8,0,0,1,0-16H196.69L138.34,61.66a8,8,0,0,1,11.32-11.32l72,72A8,8,0,0,1,221.66,133.66Z" />
              </svg>
              חזרה לדף הבית
            </a>
            <button className={`${styles.btn} ${styles.ghost}`} type="button" onClick={() => location.reload()}>
              <svg className={styles.ic} width="18" height="18" viewBox="0 0 256 256" fill="currentColor" aria-hidden="true">
                <path d="M240,56v48a8,8,0,0,1-8,8H184a8,8,0,0,1,0-16H211.4L184.81,71.64l-.25-.24a80,80,0,1,0-1.67,114.78,8,8,0,0,1,11,11.63A95.44,95.44,0,0,1,128,224h-1.32A96,96,0,1,1,195.75,60L224,85.8V56a8,8,0,1,1,16,0Z" />
              </svg>
              רענון העמוד
            </button>
            <a className={`${styles.btn} ${styles.ghost}`} href={HI_CHAT_URL} target="_blank" rel="noopener noreferrer">
              <img
                src={hiChatLogo}
                alt="hiChat"
                style={{ height: 30, cursor: "pointer" }}
                onClick={() =>
                  window.open(
                    "_blank"
                  )
                }
              />
              שליחת שגיאה ל-HI Chat
            </a>
          </div>
        </section>

        {/* משמאל (RTL) — האיור */}
        <aside className={styles.art} aria-hidden="true">
          <i className={`${styles.q} ${styles.q1}`}></i>
          <i className={`${styles.q} ${styles.q2}`}></i>
          <i className={`${styles.dot} ${styles.d1}`}></i>
          <i className={`${styles.dot} ${styles.d2}`}></i>
          <i className={`${styles.dot} ${styles.d3}`}></i>
          <div className={styles.code}>
            <span>4</span>
            <svg className={styles.zero} viewBox="0 0 46 46">
              <g className={styles.m}>
                {/* Logo artwork colors: no exact token, TODO(tokens) */}
                <path fill="#CFCAC2" d="M22 2A20 20 0 0 0 2 22h20z" />
                <path fill="#CFCAC2" d="M24 24v20a20 20 0 0 0 20-20z" />
                <circle cx="33" cy="11" r="9" fill="#F7A823" />
                <circle cx="11" cy="33" r="9" fill="#F0522F" />
              </g>
            </svg>
            <span>4</span>
          </div>
          <div className={styles.task}>
            <div className={styles.taskH}>
              <span className={styles.crumb}><i></i>ציר ניווט · עמודים במערכת</span>
              <span className={styles.chip}>
                <svg className={styles.ic} width="14" height="14" viewBox="0 0 256 256" fill="currentColor" aria-hidden="true">
                  <path d="M128,24A104,104,0,1,0,232,128,104.11,104.11,0,0,0,128,24Zm-8,56a8,8,0,0,1,16,0v56a8,8,0,0,1-16,0Zm8,104a12,12,0,1,1,12-12A12,12,0,0,1,128,184Z" />
                </svg>
                לא הושלם
              </span>
            </div>
            <h3><small>תרגיל</small>למצוא את העמוד</h3>
            <div className={styles.track}>
              <div className={`${styles.st} ${styles.done}`}><b></b>התקבל</div>
              <div className={`${styles.st} ${styles.now}`}><b></b>בתהליך<em>נתקע כאן</em></div>
              <div className={styles.st}><b></b>בוצע</div>
              <div className={styles.st}><b></b>נבדק</div>
              <div className={styles.st}><b></b>הושלם</div>
            </div>
            <div className={styles.fb}>
              <span className={styles.av}>
                <svg className={styles.ic} width="17" height="17" viewBox="0 0 256 256" fill="currentColor" aria-hidden="true">
                  <path d="M216,40H40A16,16,0,0,0,24,56V200a16,16,0,0,0,16,16H53.39a8,8,0,0,0,7.23-4.57,48,48,0,0,1,86.76,0,8,8,0,0,0,7.23,4.57H216a16,16,0,0,0,16-16V56A16,16,0,0,0,216,40ZM80,144a24,24,0,1,1,24,24A24,24,0,0,1,80,144Zm136,56H159.43a64.39,64.39,0,0,0-28.83-26.16,40,40,0,1,0-53.2,0A64.39,64.39,0,0,0,48.57,200H40V56H216ZM56,96V80a8,8,0,0,1,8-8H192a8,8,0,0,1,8,8v96a8,8,0,0,1-8,8H176a8,8,0,0,1,0-16h8V88H72v8a8,8,0,0,1-16,0Z" />
                </svg>
              </span>
              <p><small>משוב החופף</small>ניסיון ראשון יפה. הפעם התיקון אצלנו.</p>
            </div>
            <div className={styles.taskF}><span>ניסיון 1</span><span>ניסיון חוזר: בקרוב</span></div>
          </div>
        </aside>
      </main>
    </div>
  );
}