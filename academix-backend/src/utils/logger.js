const fs = require("fs");
const path = require("path");

// ═══════════════════════════════════════════════════════════
// Configuration (env vars, see .env.example)
// ═══════════════════════════════════════════════════════════
const intEnv = (name, fallback) => {
  const value = Number.parseInt(process.env[name], 10);
  return Number.isNaN(value) ? fallback : value;
};

const LOG_DIR = process.env.LOG_DIR
  ? path.resolve(process.env.LOG_DIR)
  : path.join(__dirname, "../../logs");
fs.mkdirSync(LOG_DIR, { recursive: true });

// Daily files older than this are deleted (0 = keep everything).
const RETENTION_DAYS = intEnv("LOG_RETENTION_DAYS", 30);
// Request bodies are not logged by default (personal data, credentials): only their keys.
const LOG_REQUEST_BODY = process.env.LOG_REQUEST_BODY === "true";
const MAX_FIELD_LENGTH = 2000;

const LOG_LEVELS = {
  ERROR: "ERROR",
  WARN: "WARN",
  INFO: "INFO",
  DEBUG: "DEBUG",
};
const LEVEL_RANK = { ERROR: 0, WARN: 1, INFO: 2, DEBUG: 3 };
const MIN_LEVEL = (
  process.env.LOG_LEVEL || (process.env.NODE_ENV === "production" ? "info" : "debug")
).toUpperCase();
const MIN_RANK = LEVEL_RANK[MIN_LEVEL] ?? LEVEL_RANK.DEBUG;

// Same split as before: errors.log, info.log, and warn + debug in debug.log.
const FILE_FOR_LEVEL = { ERROR: "errors", WARN: "debug", INFO: "info", DEBUG: "debug" };

const CONSOLE_ENABLED = process.env.NODE_ENV !== "production";
// Colors and the Hebrew fix only make sense in an interactive terminal.
const IS_TTY = Boolean(process.stdout.isTTY);

// ═══════════════════════════════════════════════════════════
// ANSI Color Codes
// ═══════════════════════════════════════════════════════════
const ansi = {
  reset: "\x1b[0m",
  bold: "\x1b[1m",
  dim: "\x1b[2m",

  // צבעי טקסט
  white: "\x1b[37m",
  gray: "\x1b[90m",
  red: "\x1b[31m",
  green: "\x1b[32m",
  yellow: "\x1b[33m",
  blue: "\x1b[34m",
  magenta: "\x1b[35m",
  cyan: "\x1b[36m",

  // צבעי רקע
  bgRed: "\x1b[41m",
  bgGreen: "\x1b[42m",
  bgYellow: "\x1b[43m",
  bgBlue: "\x1b[44m",
};
const colors = IS_TTY
  ? ansi
  : Object.fromEntries(Object.keys(ansi).map((key) => [key, ""]));

// צבעים לפי רמת לוג
const levelColors = {
  ERROR: { text: colors.red, bg: colors.bgRed },
  WARN: { text: colors.yellow, bg: colors.bgYellow },
  INFO: { text: colors.cyan, bg: colors.bgBlue },
  DEBUG: { text: colors.gray, bg: "" },
};

// ═══════════════════════════════════════════════════════════
// Emoji Icons
// ═══════════════════════════════════════════════════════════
const icons = {
  user: "👤",
  function: "🔧",
  endpoint: "🌐",
  method: "🔄",
  status: "📊",
  duration: "⏱️",
  ip: "🌍",
  stack: "📍",
  error: "❌",
  body: "📦",
  query: "🔍",
  params: "📌",
  clock: "🕐",
  success: "✅",
  warning: "⚠️",
  info: "ℹ️",
};

const getTimestamp = () => new Date().toISOString();

const generateErrorId = () =>
  `ERR-${Date.now()}-${Math.random().toString(36).slice(2, 11)}`;

// ═══════════════════════════════════════════════════════════
// פונקציה שמתקנת הצגת עברית בטרמינל
// ═══════════════════════════════════════════════════════════
const fixHebrewForConsole = (text) => {
  return text
    .split("\n")
    .map((line) => {
      const parts = [];
      let current = "";
      let lastType = null;

      for (let i = 0; i < line.length; i++) {
        const char = line[i];
        const isEmoji = char.charCodeAt(0) > 255;
        const isAscii = /[a-zA-Z0-9=─━▬_#:\s\[\]{}()|\\/]/.test(char);
        const currentType = isEmoji
          ? "emoji"
          : isAscii
          ? "ascii"
          : "hebrew";

        if (
          lastType === null ||
          currentType === lastType ||
          currentType === "ascii"
        ) {
          current += char;
        } else {
          if (current) parts.push(current);
          current = char;
        }
        lastType = currentType;
      }
      if (current) parts.push(current);

      return parts
        .map((part) => {
          const isHebrew = /[֐-׿]/.test(part);
          return isHebrew ? part.split("").reverse().join("") : part;
        })
        .join("");
    })
    .join("\n");
};

// ═══════════════════════════════════════════════════════════
// Sanitizing: no credentials, no full request bodies
// ═══════════════════════════════════════════════════════════
const SENSITIVE_KEY = /pass(word|phrase)?|secret|token|cookie|authorization|credential|^pfx$/i;

const redact = (value, depth = 0) => {
  if (value === null || typeof value !== "object") return value;
  if (depth > 5) return "[…]";
  if (Array.isArray(value)) return value.map((item) => redact(item, depth + 1));
  return Object.fromEntries(
    Object.entries(value).map(([key, item]) => [
      key,
      SENSITIVE_KEY.test(key) ? "[REDACTED]" : redact(item, depth + 1),
    ])
  );
};

const clip = (value) => {
  const json = JSON.stringify(value);
  if (json === undefined || json.length <= MAX_FIELD_LENGTH) return value;
  return `${json.slice(0, MAX_FIELD_LENGTH)}… (${json.length} chars, truncated)`;
};

const isEmpty = (value) =>
  value === undefined ||
  value === null ||
  (typeof value === "object" && Object.keys(value).length === 0);

const sanitizeMetadata = (metadata) => {
  const result = { ...metadata };

  if ("body" in result) {
    const { body } = result;
    delete result.body;
    if (!isEmpty(body)) {
      if (LOG_REQUEST_BODY) {
        result.body = clip(redact(body));
      } else {
        result.bodyKeys =
          typeof body === "object" ? Object.keys(body) : `[${typeof body}]`;
      }
    }
  }

  for (const key of ["query", "params"]) {
    if (key in result) {
      if (isEmpty(result[key])) delete result[key];
      else result[key] = clip(redact(result[key]));
    }
  }

  return result;
};

// ═══════════════════════════════════════════════════════════
// Files: one per level and per day, written asynchronously
// ═══════════════════════════════════════════════════════════
const BOM = "﻿"; // lets old Windows tools display Hebrew correctly
const DATED_FILE = /^(errors|info|debug)-(\d{4}-\d{2}-\d{2})\.log$/;

const localDay = (date = new Date()) => {
  const pad = (n) => String(n).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
};

const removeOldFiles = async () => {
  if (RETENTION_DAYS <= 0) return;
  const limit = localDay(new Date(Date.now() - RETENTION_DAYS * 24 * 60 * 60 * 1000));
  try {
    const files = await fs.promises.readdir(LOG_DIR);
    for (const file of files) {
      const match = file.match(DATED_FILE);
      if (match && match[2] < limit) {
        await fs.promises.unlink(path.join(LOG_DIR, file)).catch(() => {});
      }
    }
  } catch {
    // A failed clean-up must never break the app.
  }
};

const streams = {}; // name -> { day, stream }

const getStream = (name) => {
  const day = localDay();
  const current = streams[name];
  if (current && current.day === day) return current.stream;

  if (current) current.stream.end();
  const file = path.join(LOG_DIR, `${name}-${day}.log`);
  // Sync check once per file and per day only (on rotation), not on every line.
  const isNew = !fs.existsSync(file);
  const stream = fs.createWriteStream(file, { flags: "a", encoding: "utf8" });
  stream.on("error", (err) => {
    console.error(`[logger] cannot write ${file}: ${err.message}`);
  });
  if (isNew) stream.write(BOM);
  streams[name] = { day, stream };
  removeOldFiles();
  return stream;
};

const writeToFile = (level, entry) => {
  getStream(FILE_FOR_LEVEL[level]).write(`${JSON.stringify(entry)}\n`);
};

// ═══════════════════════════════════════════════════════════
// Console (development): readable, colored only in a terminal
// ═══════════════════════════════════════════════════════════
const formatReadableLog = (level, message, timestamp, metadata = {}) => {
  // ═══════════════════════════════════════════════════════════
  // חלק עליון עם כותרת צבעונית
  // ═══════════════════════════════════════════════════════════
  const levelStyle = levelColors[level] || levelColors.INFO;
  const levelTag = `${levelStyle.bg}${levelStyle.text}${colors.bold} ${level} ${colors.reset}`;

  let logString = `${colors.gray}╭${"─".repeat(60)}╮\n`;
  logString += `${colors.gray}│${colors.reset} ${icons.clock} ${timestamp} ${levelTag}\n`;
  logString += `${colors.gray}│${colors.reset} ${colors.bold}${message}${colors.reset}\n`;
  logString += `${colors.gray}╰${"─".repeat(60)}╯${colors.reset}`;

  // ═══════════════════════════════════════════════════════════
  // Meta Data בצורה קומפקטית
  // ═══════════════════════════════════════════════════════════
  const metaItems = [];

  if (metadata.userId) metaItems.push(`${icons.user} ${metadata.userId}`);
  if (metadata.userName) metaItems.push(`${icons.user} ${metadata.userName}`);
  if (metadata.functionName) metaItems.push(`${icons.function} ${metadata.functionName}`);
  if (metadata.endpoint) metaItems.push(`${icons.endpoint} ${metadata.endpoint}`);
  if (metadata.method) metaItems.push(`${icons.method} ${metadata.method}`);
  if (metadata.statusCode) {
    const statusColor =
      metadata.statusCode >= 500
        ? colors.red
        : metadata.statusCode >= 400
        ? colors.yellow
        : metadata.statusCode >= 300
        ? colors.cyan
        : colors.green;
    metaItems.push(`${icons.status} ${statusColor}${metadata.statusCode}${colors.reset}`);
  }
  if (metadata.duration) {
    const durationColor = metadata.duration > 1000 ? colors.red : colors.green;
    metaItems.push(`${icons.duration} ${durationColor}${metadata.duration}ms${colors.reset}`);
  }
  if (metadata.ip) metaItems.push(`${icons.ip} ${metadata.ip}`);

  // הצגת Meta Items בשורה אחת אם אפשר
  if (metaItems.length > 0) {
    logString += `\n${colors.gray}├─ Meta ──────────────────────────────────────────────────────${colors.reset}`;
    logString += `\n${colors.gray}│${colors.reset} ${metaItems.join(`  ${colors.gray}│${colors.reset} `)}`;
  }

  // שגיאות ו-stack
  if (metadata.stack) {
    logString += `\n${colors.red}${icons.stack} Stack:${colors.reset}`;
    metadata.stack.split("\n").forEach((line) => {
      logString += `\n${colors.dim}${line}${colors.reset}`;
    });
  }

  if (metadata.originalError) {
    logString += `\n${colors.red}${icons.error} Original Error: ${metadata.originalError}${colors.reset}`;
  }

  // JSON Data (body, query, params)
  const dataLines = [];
  if (metadata.body !== undefined) dataLines.push(`${icons.body} Body: ${JSON.stringify(metadata.body)}`);
  if (metadata.bodyKeys) dataLines.push(`${icons.body} Body keys: ${JSON.stringify(metadata.bodyKeys)}`);
  if (metadata.query) dataLines.push(`${icons.query} Query: ${JSON.stringify(metadata.query)}`);
  if (metadata.params) dataLines.push(`${icons.params} Params: ${JSON.stringify(metadata.params)}`);

  if (dataLines.length > 0) {
    logString += `\n${colors.gray}├─ Data ──────────────────────────────────────────────────────${colors.reset}`;
    dataLines.forEach((line) => {
      logString += `\n${colors.gray}│${colors.reset} ${colors.dim}${line}${colors.reset}`;
    });
  }

  logString += `\n${colors.gray}└${"─".repeat(58)}${colors.reset}\n`;

  return logString;
};

// ═══════════════════════════════════════════════════════════
// Entry point
// ═══════════════════════════════════════════════════════════
const log = (level, message, metadata = {}) => {
  const errorId = metadata.errorId || generateErrorId();
  if (LEVEL_RANK[level] > MIN_RANK) return errorId;

  const timestamp = getTimestamp();
  const safeMetadata = sanitizeMetadata({ ...metadata, errorId });

  // Files: one JSON object per line (easy to grep / parse), no ANSI codes.
  writeToFile(level, { time: timestamp, level, message, ...safeMetadata });

  // ═══════════════════════════════════════════════════════════
  // הדפסה לקונסול עם תיקון עברית
  // ═══════════════════════════════════════════════════════════
  if (CONSOLE_ENABLED) {
    const readableLog = formatReadableLog(level, message, timestamp, safeMetadata);
    console.log(IS_TTY ? fixHebrewForConsole(readableLog) : readableLog);
  }

  return errorId;
};

const logger = {
  error: (message, metadata = {}) =>
    log(LOG_LEVELS.ERROR, message, metadata),
  warn: (message, metadata = {}) => log(LOG_LEVELS.WARN, message, metadata),
  info: (message, metadata = {}) => log(LOG_LEVELS.INFO, message, metadata),
  debug: (message, metadata = {}) =>
    log(LOG_LEVELS.DEBUG, message, metadata),
};

module.exports = logger;
