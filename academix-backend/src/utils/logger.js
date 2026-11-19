const fs = require("fs");
const path = require("path");

const LOG_DIR = path.join(__dirname, "../../logs");
if (!fs.existsSync(LOG_DIR)) {
  fs.mkdirSync(LOG_DIR, { recursive: true });
}

const ERROR_LOG_FILE = path.join(LOG_DIR, "errors.log");
const INFO_LOG_FILE = path.join(LOG_DIR, "info.log");
const DEBUG_LOG_FILE = path.join(LOG_DIR, "debug.log");

const LOG_LEVELS = {
  ERROR: "ERROR",
  WARN: "WARN",
  INFO: "INFO",
  DEBUG: "DEBUG",
};

// ═══════════════════════════════════════════════════════════
// ANSI Color Codes
// ═══════════════════════════════════════════════════════════
const colors = {
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
  `ERR-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

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
          const isHebrew = /[\u0590-\u05FF]/.test(part);
          return isHebrew ? part.split("").reverse().join("") : part;
        })
        .join("");
    })
    .join("\n");
};

const BOM = "\uFEFF";

const writeToFile = (filePath, content) => {
  if (!fs.existsSync(filePath)) {
    fs.writeFileSync(filePath, BOM, "utf8");
  }
  fs.appendFileSync(filePath, content + "\n", "utf8");
};

const formatReadableLog = (level, message, metadata = {}) => {
  const timestamp = getTimestamp();
  const errorId = metadata.errorId || generateErrorId();

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
  const jsonItems = [];
  if (metadata.body) jsonItems.push(`${icons.body} Body`);
  if (metadata.query) jsonItems.push(`${icons.query} Query`);
  if (metadata.params) jsonItems.push(`${icons.params} Params`);

  if (jsonItems.length > 0) {
    logString += `\n${colors.gray}├─ Data ──────────────────────────────────────────────────────${colors.reset}`;
    if (metadata.body) {
      logString += `\n${colors.gray}│${colors.reset} ${icons.body} Body: ${colors.dim}${JSON.stringify(metadata.body)}${colors.reset}`;
    }
    if (metadata.query) {
      logString += `\n${colors.gray}│${colors.reset} ${icons.query} Query: ${colors.dim}${JSON.stringify(metadata.query)}${colors.reset}`;
    }
    if (metadata.params) {
      logString += `\n${colors.gray}│${colors.reset} ${icons.params} Params: ${colors.dim}${JSON.stringify(metadata.params)}${colors.reset}`;
    }
  }

  // Error ID
  logString += `\n${colors.gray}└${"─".repeat(58)}${colors.red}${colors.bold} ${colors.reset}\n`;

  return logString;
};

const log = (level, message, metadata = {}) => {
  const errorId = metadata.errorId || generateErrorId();
  const enrichedMetadata = { ...metadata, errorId };
  const readableLog = formatReadableLog(level, message, enrichedMetadata);

  switch (level) {
    case LOG_LEVELS.ERROR:
      writeToFile(ERROR_LOG_FILE, readableLog);
      break;
    case LOG_LEVELS.WARN:
    case LOG_LEVELS.DEBUG:
      writeToFile(DEBUG_LOG_FILE, readableLog);
      break;
    case LOG_LEVELS.INFO:
      writeToFile(INFO_LOG_FILE, readableLog);
      break;
  }

  // ═══════════════════════════════════════════════════════════
  // הדפסה לקונסול עם תיקון עברית
  // ═══════════════════════════════════════════════════════════
  if (process.env.NODE_ENV !== "production") {
    const correctedLog = fixHebrewForConsole(readableLog);
    console.log(correctedLog);
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