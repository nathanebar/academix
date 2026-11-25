// Demo data for local development and reproducible screenshots (redesign-prep Epic #97).
// Usage: npm run db:seed:demo   (after npm run db:init and npm run db:seed)
// Creates 2 domains, 3 courses, 2 batches per course, 2 teams per batch (1 team commander + 6 students),
// course-level axes / task groups / tasks and dated task assignments, in one transaction.
// Does nothing if the demo data already exists. Refuses to run with NODE_ENV=production.
// Every demo user has the password "1234". Usernames: domain1-2, course1-3, tc_c<course>b<batch>t<team>,
// st_c<course>b<batch>t<team>_<1-6>.
require("dotenv").config({ quiet: true });
const db = require("../models");
const { hashPassword } = require("../src/utils/password");

const DOMAINS = [
  {
    name: "תחום הנדסה",
    courses: [
      { name: "קורס פיתוח תוכנה", axes: ["יסודות תכנות", "פיתוח Web", "מסדי נתונים"] },
      { name: "קורס סייבר", axes: ["רשתות", "הגנת מערכות"] },
    ],
  },
  {
    name: "תחום פיקוד והדרכה",
    courses: [{ name: "קורס מפקדי צוותים", axes: ["מנהיגות", "הדרכה", "תכנון"] }],
  },
];
const BATCHES = [
  { name: "מחזור א' 2026", start: "2026-09-01" },
  { name: "מחזור ב' 2027", start: "2027-02-01" },
];
const TEAMS_PER_BATCH = ["צוות 1", "צוות 2"];
const STUDENTS_PER_TEAM = 6;
const FIRST = ["נועה", "איתי", "מאיה", "יונתן", "שירה", "עומר", "תמר", "דניאל", "אור", "רוני", "ליה", "אלון", "יעל", "גיא", "הילה", "עידו"];
const LAST = ["כהן", "לוי", "מזרחי", "פרץ", "ביטון", "אברהם", "פרידמן", "אזולאי", "דהן", "שפירא"];
const TASKS = ["הרצאת פתיחה", "תרגיל מעשי", "קריאת חומר", "מטלת הגשה", "בוחן ביניים"];
const COLORS = ["#1677ff", "#52c41a", "#fa8c16", "#eb2f96", "#722ed1", "#13c2c2"];

let userSeq = 0;
(async () => {
  if (process.env.NODE_ENV === "production") {
    console.error("seed-demo refuses to run with NODE_ENV=production");
    process.exitCode = 1;
    await db.sequelize.close();
    return;
  }
  const m = db;
  const t = await db.sequelize.transaction();
  try {
    if (await m.Domain.findOne({ where: { name: DOMAINS[0].name }, transaction: t })) {
      console.log("Demo data already present, nothing to do.");
      await t.rollback();
      return;
    }
    const password = await hashPassword("1234");
    const system = await m.System.findOne({ where: { name: "Academix" }, transaction: t });
    const admin = await m.User.findOne({ where: { username: "admin" }, transaction: t });
    if (!system || !admin) throw new Error("run `npm run db:seed` first");

    const mkUser = async (username, name) => {
      userSeq += 1;
      return m.User.create(
        { username, name, militaryid: String(1000000 + userSeq), password },
        { transaction: t }
      );
    };
    const role = (user_id, role_code, scope_type, scope_id) =>
      m.RoleAssignment.create({ user_id, role_code, scope_type, scope_id }, { transaction: t });
    const stats = { users: 0, teams: 0, tasks: 0, assignments: 0 };

    for (const [di, d] of DOMAINS.entries()) {
      const domain = await m.Domain.create({ name: d.name, systemId: system.id }, { transaction: t });
      const dm = await mkUser(`domain${di + 1}`, `מנהל ${d.name}`);
      await role(dm.id, "DOMAIN_MANAGER", "domain", domain.id);
      stats.users++;

      for (const c of d.courses) {
        const ci = stats.courseIdx = (stats.courseIdx || 0) + 1;
        const course = await m.Course.create({ name: c.name, domainId: domain.id }, { transaction: t });
        const cc = await mkUser(`course${ci}`, `מפקד ${c.name}`);
        await role(cc.id, "COURSE_COMMANDER", "course", course.id);
        stats.users++;

        // Course-level axes -> task groups -> tasks
        const tasks = [];
        for (const [ai, axisName] of c.axes.entries()) {
          const axis = await m.Axis.create(
            { name: axisName, courseId: course.id, creator_id: cc.id, color: COLORS[ai % COLORS.length], repository_kind: "operational" },
            { transaction: t }
          );
          for (const g of [1, 2]) {
            const group = await m.TaskGroup.create(
              { name: `${axisName} – יחידה ${g}`, axisId: axis.id, status: "operational" },
              { transaction: t }
            );
            group._axisColor = axis.color;
            for (const [ti, tn] of TASKS.slice(0, 3).entries()) {
              const task = await m.Task.create(
                {
                  name: `${tn} – ${axisName} ${g}`,
                  description: `משימת דמו: ${tn} בנושא ${axisName}.`,
                  taskGroupId: group.id,
                  creatorId: cc.id,
                  status: "operational",
                  recommendedTime: 60 + ti * 30,
                  requiresSubmission: ti === 1,
                  color: axis.color,
                  exposure: true,
                  is_active: true,
                },
                { transaction: t }
              );
              tasks.push({ task, group });
              stats.tasks++;
            }
          }
        }

        for (const [bi, b] of BATCHES.entries()) {
          const batch = await m.CourseBatch.create(
            { name: b.name, courseId: course.id, start_date: new Date(b.start) },
            { transaction: t }
          );
          const seenGroups = new Set();
          for (const { task, group } of tasks) {
            await m.TaskBatchStatus.create({ taskId: task.id, course_batch_id: batch.id, status: "operational" }, { transaction: t });
            if (!seenGroups.has(group.id)) {
              seenGroups.add(group.id);
              await m.TaskGroupBatchStatus.create({ taskGroupId: group.id, course_batch_id: batch.id, status: "operational" }, { transaction: t });
            }
          }

          for (const [tIdx, teamName] of TEAMS_PER_BATCH.entries()) {
            const team = await m.Team.create({ name: `${teamName} – ${c.name} – ${b.name}`, courseId: course.id }, { transaction: t });
            await m.TeamCourseBatch.create({ team_id: team.id, course_batch_id: batch.id }, { transaction: t });
            stats.teams++;
            const tag = `c${ci}b${bi + 1}t${tIdx + 1}`;

            const tc = await mkUser(`tc_${tag}`, `מפקד ${teamName} (${b.name})`);
            await m.TeamMember.create({ team_id: team.id, user_id: tc.id, course_batch_id: batch.id, member_role: "TEAM_COMMANDER" }, { transaction: t });
            await role(tc.id, "TEAM_COMMANDER", "team", team.id);
            stats.users++;

            for (let s = 0; s < STUDENTS_PER_TEAM; s++) {
              const name = `${FIRST[(userSeq + s) % FIRST.length]} ${LAST[(userSeq * 3 + s) % LAST.length]}`;
              const st = await mkUser(`st_${tag}_${s + 1}`, name);
              const member = await m.TeamMember.create(
                { team_id: team.id, user_id: st.id, course_batch_id: batch.id, member_role: "STUDENT" },
                { transaction: t }
              );
              await role(st.id, "STUDENT", "team", team.id);
              stats.users++;

              // Assign the first tasks with dates around the batch start (some done)
              for (const [k, { task }] of tasks.slice(0, 8).entries()) {
                const start = new Date(b.start);
                start.setDate(start.getDate() + k);
                start.setHours(8 + (k % 4) * 2, 0, 0, 0);
                const end = new Date(start.getTime() + task.recommendedTime * 60000);
                const done = bi === 0 && k < 4 && s % 3 !== 0;
                await m.TaskAssignment.create(
                  {
                    task_id: task.id,
                    user_id: member.id, // TaskAssignment.user_id holds the TeamMember id (see taskAssignment.controller.js)
                    team_id: team.id,
                    start,
                    end,
                    completed: done ? end : null,
                    completed_at: done ? end : null,
                    assigned_by_user_id: tc.id,
                  },
                  { transaction: t }
                );
                stats.assignments++;
              }
            }
          }
        }
      }
    }
    await t.commit();
    delete stats.courseIdx;
    console.log("Demo data created:", stats);
  } catch (err) {
    await t.rollback().catch(() => {});
    console.error("seed-demo failed:", err.message, err.errors?.map((e) => e.message) || "");
    process.exitCode = 1;
  } finally {
    await db.sequelize.close();
  }
})();
