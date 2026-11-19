require("dotenv").config({ quiet: true });

const express = require("express");
const app = express();
const cookieParser = require("cookie-parser");
const https = require('https');
const fs = require('fs');
const jwt = require('jsonwebtoken');

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

app.use(express.json());
app.use(cookieParser());

app.use((req, res, next) => {
  const start = Date.now();

  res.on('finish', () => {
    if (res.statusCode >= 400) {
      const duration = Date.now() - start;

      let userId = null;
      let userName = null;
      let userSource = 'none';

      if (req.headers['x-user-id'] || req.headers['x-user-name']) {
        userId = req.headers['x-user-id'];
        userName = req.headers['x-user-name'];
        userSource = 'localStorage';
      }

      if (!userName && req.cookies?.token) {
        try {
          const decoded = jwt.verify(req.cookies.token, process.env.JWT_SECRET);
          userId = decoded.id;
          userName = decoded.name;
          userSource = 'jwt';
        } catch (e) { }
      }

      if (!userName && req.ntlm?.UserName) {
        userName = req.ntlm.UserName;
        userSource = 'ntlm';
        userId = req.ntlm.UserName;
      }

      const logLevel = res.statusCode >= 500 ? 'error' : 'warn';

    }
  });

  next();
});

// Optionnel : exiger un JWT valide sur toutes les routes /api sauf /api/auth
if (process.env.REQUIRE_AUTH === 'true') {
  const { validateJWT } = require("./src/controllers/auth");
  app.use("/api", (req, res, next) =>
    req.path.startsWith("/auth") ? next() : validateJWT(req, res, next)
  );
}

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