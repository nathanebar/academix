require("dotenv").config({ quiet: true });

const express = require("express");
const app = express();
const cookieParser = require("cookie-parser");
const compression = require("compression");
const helmet = require("helmet");
const https = require('https');
const fs = require('fs');

const logger = require('./src/utils/logger');
const { notFoundHandler, globalErrorHandler } = require('./src/middlewares/errorHandler');

const userRoutes = require("./src/routes/user.routes");
const domainRoutes = require("./src/routes/domain.routes");
const courseRoutes = require("./src/routes/course.routes");
const courseBatchRoutes = require("./src/routes/courseBatch.routes");
const axisBatchArhiveRoutes = require("./src/routes/axisBatchArchive.routes");
const axisRoutes = require("./src/routes/axis.routes");
const taskGroupRoutes = require("./src/routes/taskGroup.routes");
const taskRoutes = require("./src/routes/task.routes");
const taskChecklistOverlapRoutes = require("./src/routes/taskChecklistOverlapRoutes.routes");
const formRoutes = require("./src/routes/form.routes");
const formSubmissionsAnswersRoutes = require("./src/routes/formSubmissionsAnswers.routes");
const taskAssignmentRoutes = require("./src/routes/taskAssignment.routes");
const roleAssignmentRoutes = require("./src/routes/roleAssignment.routes");
const teamMemberRoutes = require("./src/routes/teamMember.routes");
const teamRoutes = require("./src/routes/team.routes");
const roleRoutes = require("./src/routes/role.routes");
const permissionsRoutes = require("./src/routes/permissions.routes");
const calendarRoutes = require("./src/routes/calendar.routes");
const teamTaskAssignmentRoutes = require("./src/routes/teamTaskAssignment.routes");
const filesRoutes = require("./src/routes/file.routes");
const checkListsRoutes = require("./src/routes/checkLists.routes");
const formSubmissionRoutes = require("./src/routes/formSubmission.routes");
const authRoutes = require("./src/routes/auth");
const axisTemplateRoutes = require("./src/routes/axisTemplate.routes");
const feedbackRoutes = require("./src/routes/feedbackRoutes");
const assignmentProgressRoutes = require("./src/routes/assignmentProgressRoutes.routes");
const gradeStageRoutes = require("./src/routes/gradeStage.routes");
const tagRoutes = require("./src/routes/tag.routes");
const systemRoutes = require("./src/routes/system.routes");
const taskVisibilityOverrideRoutes = require('./src/routes/taskVisibilityOverride.routes');
const teamCourseBatchRoutes = require("./src/routes/teamCourseBatch.routes")
const taskAssignmentHoefRoutes = require("./src/routes/taskAssignmentHoef.routes");
const teamEventsRoutes = require("./src/routes/teamEvents.routes");
const TeamEventsAssignmentRoutes = require("./src/routes/teamEventAssignment.routes");
const teamAxisOrderRoutes = require("./src/routes/teamAxisOrder.routes");
const queueRoutes = require("./src/routes/queueRoutes.routes");
const notebookFolderRouter = require("./src/routes/notebookFolder");
const notebookNotesRouter = require("./src/routes/notebookNotes");
const courseBatchFolderRoutes = require("./src/routes/courseBatchFolder.routes");
const courseBatchFolderFileRoutes = require("./src/routes/courseBatchFolderFile.routes");

const cors = require("cors");

const useHttps = process.env.HTTPS === 'true';
const corsOrigins = (process.env.CORS_ORIGINS || '')
  .split(',')
  .map((o) => o.trim())
  .filter(Boolean);

app.use(
  cors({
    origin: corsOrigins,
    methods: 'GET, PUT, POST, DELETE,PATCH',
    preflightContinue: false,
    optionSuccessStatus: 204,
    credentials: true,
  })
);

// Behind a reverse proxy, req.ip must come from X-Forwarded-For (login rate limit, logs).
// TRUST_PROXY = number of proxies in front of the API (e.g. 1), or an Express trust-proxy value.
if (process.env.TRUST_PROXY) {
  const hops = Number(process.env.TRUST_PROXY);
  app.set('trust proxy', Number.isNaN(hops) ? process.env.TRUST_PROXY : hops);
}

// Security headers. Adjusted for this API:
// - files from /files/stream-file are shown in an <iframe> of the frontend, which may run on
//   another origin (CORS_ORIGINS): framing is allowed for those origins with CSP
//   frame-ancestors instead of X-Frame-Options (which cannot list several origins);
// - no other CSP directive: the API serves JSON and files (a default-src would break PDFs
//   opened inline), the frontend is served elsewhere;
// - Cross-Origin-Resource-Policy "cross-origin": files are loaded by the frontend's origin;
// - HSTS only when the API itself runs in HTTPS.
app.use(
  helmet({
    contentSecurityPolicy: {
      useDefaults: false,
      directives: {
        defaultSrc: helmet.contentSecurityPolicy.dangerouslyDisableDefaultSrc,
        frameAncestors: ["'self'", ...corsOrigins],
      },
    },
    xFrameOptions: false,
    crossOriginResourcePolicy: { policy: 'cross-origin' },
    strictTransportSecurity: useHttps ? { maxAge: 15552000, includeSubDomains: false } : false,
  })
);

// gzip/deflate for API responses (JSON compresses ~10x). File streams are left alone:
// media is already compressed, and they must keep their byte ranges (see #7).
app.use(
  compression({
    filter: (req, res) =>
      !/\/(stream|download)-file$/.test(req.path) && compression.filter(req, res),
  })
);

app.use(express.json());
app.use(cookieParser());

// Identity from the JWT cookie, active role from X-Role-Assignment-Id, allowed ids checked
// server-side (#13). With REQUIRE_AUTH=true, every /api route except /api/auth needs a token.
require("./src/middlewares/auth").installAuth(app);

app.use("/api/systems", systemRoutes);
app.use("/api/domains", domainRoutes);
app.use("/api/courses", courseRoutes);
app.use("/api/courseBatch", courseBatchRoutes);
app.use("/api/axisBatch", axisBatchArhiveRoutes);
app.use("/api/axes", axisRoutes);
app.use("/api/teams", teamRoutes);
app.use("/api/users", userRoutes);
app.use("/api/roles", roleRoutes);
app.use("/api/forms", formRoutes);
app.use("/api/formSubmissionsAnswers", formSubmissionsAnswersRoutes);
app.use("/api/taskGroup", taskGroupRoutes);
app.use("/api/tasks", taskRoutes);
app.use("/api/task-checklist-overlap", taskChecklistOverlapRoutes);
app.use("/api/task-assignments", taskAssignmentRoutes);
app.use("/api/assignmen_progress", assignmentProgressRoutes);
app.use("/api/roleAssignments", roleAssignmentRoutes);
app.use("/api/teamMembers", teamMemberRoutes);
app.use("/api/permissions", permissionsRoutes);
app.use("/api/calendar", calendarRoutes);
app.use("/api/auth", authRoutes);
app.use("/api/team-task-assignments", teamTaskAssignmentRoutes);
app.use("/api/files", filesRoutes);
app.use("/api/axisTemplate", axisTemplateRoutes);
app.use("/api/checklists", checkListsRoutes);
app.use("/api/feedback", feedbackRoutes);
app.use("/api/formSubmissions", formSubmissionRoutes);
app.use("/api/gradeStages", gradeStageRoutes);
app.use("/api/tag", tagRoutes);
app.use("/api/task-visibility-overrides", taskVisibilityOverrideRoutes);
app.use("/api/teamCourseBatch", teamCourseBatchRoutes);
app.use("/api/hoefs", taskAssignmentHoefRoutes);
app.use("/api/teamEvents", teamEventsRoutes);
app.use("/api/teamEventsAssignment", TeamEventsAssignmentRoutes);
app.use("/api/team-axis-order", teamAxisOrderRoutes);
app.use("/api/queue", queueRoutes);
app.use("/api/notebook", notebookFolderRouter);
app.use("/api/notebook-notes", notebookNotesRouter);

app.use("/api/course-batch-folders", courseBatchFolderRoutes);
app.use("/api/course-batch-folder-files", courseBatchFolderFileRoutes);

app.use(notFoundHandler);
app.use(globalErrorHandler);

const PORT = process.env.PORT || 8007;

if (!process.env.JWT_SECRET) {
  console.error("JWT_SECRET is not set (see .env.example)");
  process.exit(1);
}

if (useHttps) {
  const server = https.createServer(
    {
      pfx: fs.readFileSync(require('path').resolve(__dirname, process.env.CERT_PATH || 'certificate/cert.pfx')),
      passphrase: process.env.PASSWORD,
    },
    app
  );
  server.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
  });
} else {
  app.listen(PORT, () => {
    console.log(`Server is running at local on port ${PORT}`);
  });
}

module.exports = app;