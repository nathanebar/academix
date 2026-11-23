// File uploads: written to a temporary file on disk instead of RAM (memoryStorage kept the
// whole file in memory, twice during the S3 upload), with a size limit and a list of
// blocked file types. The temporary file is deleted once the response is sent.
const fs = require("fs");
const os = require("os");
const path = require("path");
const multer = require("multer");
const { catchError } = require("../utils/errorHandler");

const intEnv = (name, fallback) => {
  const value = Number.parseInt(process.env[name], 10);
  return Number.isNaN(value) ? fallback : value;
};

const MAX_FILE_SIZE_MB = intEnv("UPLOAD_MAX_FILE_SIZE_MB", 2048);
const TMP_DIR = process.env.UPLOAD_TMP_DIR
  ? path.resolve(process.env.UPLOAD_TMP_DIR)
  : path.join(os.tmpdir(), "academix-uploads");
fs.mkdirSync(TMP_DIR, { recursive: true });

// Executables and files a browser would run (served from the bucket, they could run scripts).
// A deny list rather than an allow list, so that legitimate course material (documents,
// media, archives...) keeps working. Override with UPLOAD_BLOCKED_EXTENSIONS ("" = none).
const BLOCKED_EXTENSIONS = new Set(
  (process.env.UPLOAD_BLOCKED_EXTENSIONS ??
    "exe,msi,bat,cmd,com,scr,pif,ps1,vbs,vbe,wsf,jar,dll,sh,js,mjs,html,htm,xhtml,shtml,hta")
    .split(",")
    .map((ext) => ext.trim().toLowerCase().replace(/^\./, ""))
    .filter(Boolean)
);

const upload = multer({
  storage: multer.diskStorage({ destination: TMP_DIR }),
  limits: { fileSize: MAX_FILE_SIZE_MB * 1024 * 1024, files: 1 },
  fileFilter: (req, file, cb) => {
    const ext = path.extname(file.originalname || "").slice(1).toLowerCase();
    if (BLOCKED_EXTENSIONS.has(ext)) {
      const error = new Error(`File type .${ext} is not allowed`);
      error.code = "BLOCKED_FILE_TYPE";
      cb(error);
      return;
    }
    cb(null, true);
  },
});

const removeTempFile = (file) => {
  if (file?.path) fs.promises.unlink(file.path).catch(() => {});
};

// Drop-in replacement for upload.single(field): same req.file (with .path instead of
// .buffer) and req.body, clear errors (413 / 415 / 400), temp file always removed.
const singleFile = (field) => (req, res, next) => {
  upload.single(field)(req, res, (error) => {
    if (error) {
      removeTempFile(req.file);
      if (error.code === "LIMIT_FILE_SIZE") {
        return res.status(413).json({ error: `File too large (max ${MAX_FILE_SIZE_MB} MB)` });
      }
      if (error.code === "BLOCKED_FILE_TYPE") {
        return res.status(415).json({ error: error.message });
      }
      // Multer's own errors (unexpected field, too many files...) are safe to show. Anything else
      // (disk / temp folder errors, malformed body) may contain server paths: hidden in production.
      if (error instanceof multer.MulterError) return res.status(400).json({ error: error.message });
      return catchError(error, req, res, { function: "upload.singleFile", status: 400 });
    }
    if (req.file) res.on("close", () => removeTempFile(req.file));
    next();
  });
};

// Readable stream of the uploaded file, for PutObjectCommand (with ContentLength).
const fileStream = (file) => fs.createReadStream(file.path);

module.exports = { singleFile, fileStream, MAX_FILE_SIZE_MB };
