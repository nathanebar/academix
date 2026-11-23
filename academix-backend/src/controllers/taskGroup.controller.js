const { TaskGroup, TaskGroupBatchStatus, File, Task, Axis } = require("../../models");
const { sequelize } = require("../../models/index");
const fileController = require("../controllers/file.controller");
const logger = require("../utils/logger");
const { catchError } = require("../utils/errorHandler");

module.exports = {
  async getAll(req, res) {
    try {
      const taskGroups = await TaskGroup.findAll();
      res.json(taskGroups);
    } catch (err) {
      catchError(err, req, res, { function: "taskGroup.getAll" });
    }
  },

  async getById(req, res) {
    try {
      const taskGroup = await TaskGroup.findByPk(req.params.id);
      if (!taskGroup)
        return res.status(404).json({ error: "TaskGroup not found" });
      res.json(taskGroup);
    } catch (err) {
      catchError(err, req, res, { function: "taskGroup.getById" });
    }
  },

  async create(req, res) {
    const { selectedCourseBatch, axisId } = req.params;

    try {
      const taskGroupData = { ...req.body };

      // 🔽 אם אין team_id על קבוצת המשימות – נשלים מה-Axis
      if (!taskGroupData.team_id) {
        const axis = await Axis.findByPk(axisId);
        if (axis?.team_id) {
          taskGroupData.team_id = axis.team_id;
        }
      }

      const newTaskGroup = await TaskGroup.create(taskGroupData);

      if (newTaskGroup) {
        await TaskGroupBatchStatus.create({
          taskGroupId: newTaskGroup.id,
          course_batch_id: selectedCourseBatch,
          status: newTaskGroup.status,
          createdAt: new Date(),
          updatedAt: new Date(),
        });
      }

      logger.info("TaskGroup created", {
        taskGroupId: newTaskGroup.id,
        axisId: axisId,
        courseBatchId: selectedCourseBatch,
        name: newTaskGroup.name,
        userId: req.headers["x-user-id"],
      });

      res.status(201).json(newTaskGroup);
    } catch (err) {
      catchError(err, req, res, { function: "taskGroup.create", status: 400 });
    }
  },

  async update(req, res) {
    try {
      const taskGroup = await TaskGroup.findByPk(req.params.id);
      if (!taskGroup)
        return res.status(404).json({ error: "TaskGroup not found" });

      const updateData = {};

      if (req.body.name !== undefined) {
        updateData.name = req.body.name;
      }

      if (req.body.status !== undefined) {
        updateData.status = req.body.status;
      }

      if (Object.keys(updateData).length > 0) {
        await taskGroup.update(updateData, { batchId: req.body.batchId });
      }

      if (req.body.status) {
        await TaskGroupBatchStatus.update(
          { status: req.body.status },
          {
            where: {
              taskGroupId: req.params.id,
              course_batch_id: req.body.batchId,
            },
          }
        );
      }

      logger.info("TaskGroup updated", {
        taskGroupId: req.params.id,
        updatedFields: Object.keys(updateData),
        batchId: req.body.batchId,
        userId: req.headers["x-user-id"],
      });

      res.json(taskGroup);
    } catch (err) {
      catchError(err, req, res, { function: "taskGroup.update", status: 400 });
    }
  },

  async remove(req, res) {
    const taskGroupId = req.params.id;
    try {
      const taskGroup = await TaskGroup.findByPk(taskGroupId);
      const reletedTasks = await Task.findAll({
        where: { taskGroupId: taskGroupId },
      });
      if (reletedTasks && reletedTasks?.length > 0) {
        for (const t of reletedTasks) {
          const reletedFiles = await File.findAll({
            where: {
              task_id: t?.id,
            },
          });
          if (reletedFiles && reletedFiles?.length > 0) {
            for (const f of reletedFiles) {
              await fileController.deleteFile(f?.id); // For Deleting Also From S3
            }
          }
        }
      }
      if (!taskGroup)
        return res.status(404).json({ error: "TaskGroup not found" });
      await taskGroup.destroy();

      logger.info("TaskGroup deleted", {
        taskGroupId: taskGroupId,
        tasksDeleted: reletedTasks?.length || 0,
        userId: req.headers["x-user-id"],
      });

      res.json({ message: "TaskGroup deleted" });
    } catch (err) {
      catchError(err, req, res, { function: "taskGroup.remove" });
    }
  },

  async getTaskGroupByAxisId(req, res) {
    try {
      const { axisId, courseBatchId } = req.params;

      if (!axisId) {
        return res.status(400).json({
          error: "axisId הוא שדה חובה",
        });
      }

      const taskGroups = await TaskGroup.findAll({
        where: { axisId: axisId },
        // order: [['created_at', 'DESC']]
      });

      return res.status(200).json({
        success: true,
        data: taskGroups,
        count: taskGroups.length,
      });
    } catch (error) {
      catchError(error, req, res);
    }
  },

async getTaskGroupByAxisIdAndCourseBatch(req, res) {
  try {
    let { axisId, courseBatchId, teamId } = req.params;
    const { userId } = req.query;

      if (teamId === "null" || teamId === "undefined" || teamId === "") {
        teamId = null;
      } else {
        teamId = Number(teamId);
      }

      const numericUserId = userId ? Number(userId) : null;

      if (!axisId) {
        return res.status(400).json({
          error: "axisId הוא שדה חובה",
        });
      }
      if (!courseBatchId) {
        return res.status(400).json({
          error: "courseBatchId חייב להיות מספר תקין",
        });
      }

      const numericAxisIds = axisId
        .split(",")
        .map((id) => Number(id.trim()))
        .filter((id) => !isNaN(id));

      if (numericAxisIds.length === 0) {
        return res.json([]);
      }

      const numericCourseBatchId = Number(courseBatchId);
      if (isNaN(numericCourseBatchId)) {
        return res.status(400).json({
          error: "courseBatchId חייב להיות מספר תקין",
        });
      }

      const taskTeamFilter = numericUserId
        ? `(t."team_id" = :teamId OR t."team_id" IS NULL) AND EXISTS (
            SELECT 1 FROM "TaskAssignments" ta 
            WHERE ta.task_id = t.id AND ta.user_id = :userId
          )`
        : `(t."team_id" = :teamId OR t."team_id" IS NULL)`;

      const query = `
        WITH task_group_data AS (
          SELECT 
            tg.id,
            tg.name,
            tg.team_id,
            tgb.status as batch_status,
            tg."axisId" as axisid
          FROM "TaskGroups" tg
          JOIN "TaskGroupBatchStatus" tgb ON tg.id = tgb."taskGroupId"
          WHERE tg."axisId" IN (:axisIds)
            AND tgb."course_batch_id" = :courseBatchId
            AND tg."deletedAt" IS NULL
            AND (tg."team_id" = :teamId OR tg."team_id" IS NULL)
        ),
        -- Counts par status de Task
        task_counts_operational AS (
          SELECT 
            t."taskGroupId",
            COUNT(*) as count
          FROM "Tasks" t
          WHERE t."deletedAt" IS NULL
            AND t.status = 'operational'
            AND t."taskGroupId" IN (SELECT id FROM task_group_data)
            AND ${taskTeamFilter}
          GROUP BY t."taskGroupId"
        ),
        task_counts_assignment_bank AS (
          SELECT 
            t."taskGroupId",
            COUNT(*) as count
          FROM "Tasks" t
          WHERE t."deletedAt" IS NULL
            AND t.status = 'assignment_bank'
            AND t."taskGroupId" IN (SELECT id FROM task_group_data)
            AND ${taskTeamFilter}
          GROUP BY t."taskGroupId"
        ),
        task_counts_archives AS (
          SELECT 
            t."taskGroupId",
            COUNT(*) as count
          FROM "Tasks" t
          WHERE t."deletedAt" IS NULL
            AND t.status = 'archives'
            AND t."taskGroupId" IN (SELECT id FROM task_group_data)
            AND ${taskTeamFilter}
          GROUP BY t."taskGroupId"
        )
        SELECT 
          JSON_BUILD_OBJECT(
            'operational', (
              SELECT COALESCE(ARRAY(
                SELECT JSON_BUILD_OBJECT(
                  'id', tg.id,
                  'name', tg.name,
                  'status', tg.batch_status,
                  'team_id', tg.team_id,
                  'task_count', COALESCE(tc.count, 0),
                    'axisId',tg."axisid"
                )
                FROM task_group_data tg
                LEFT JOIN task_counts_operational tc ON tg.id = tc."taskGroupId"
                WHERE tg.batch_status = 'operational'
              ), ARRAY[]::JSON[])
            ),
            'assignment_bank', (
              SELECT COALESCE(ARRAY(
                SELECT JSON_BUILD_OBJECT(
                  'id', tg.id,
                  'name', tg.name,
                  'status', tg.batch_status,
                  'team_id', tg.team_id,
                  'task_count', COALESCE(tc.count, 0),
            'axisId',tg."axisid"
                )
                FROM task_group_data tg
                LEFT JOIN task_counts_assignment_bank tc ON tg.id = tc."taskGroupId"
                WHERE EXISTS (
                  SELECT 1 FROM task_counts_assignment_bank tc2 WHERE tc2."taskGroupId" = tg.id
                )
              ), ARRAY[]::JSON[])
            ),
            'archives', (
              SELECT COALESCE(ARRAY(
                SELECT JSON_BUILD_OBJECT(
                  'id', tg.id,
                  'name', tg.name,
                  'status', tg.batch_status,
                  'team_id', tg.team_id,
                  'task_count', COALESCE(tc.count, 0),
                    'axisId', tg."axisid"
                )
                FROM task_group_data tg
                LEFT JOIN task_counts_archives tc ON tg.id = tc."taskGroupId"
                WHERE EXISTS (
                  SELECT 1 FROM task_counts_archives tc2 WHERE tc2."taskGroupId" = tg.id
                )
              ), ARRAY[]::JSON[])
            )
          ) as result
      `;
      const result = await sequelize.query(query, {
        replacements: {
          axisIds: numericAxisIds,
          courseBatchId: numericCourseBatchId,
          teamId: teamId,
          userId: numericUserId,
        },
        type: sequelize.QueryTypes.SELECT,
      });
      const taskGroups =
        result.length > 0
          ? result[0].result
          : {
              operational: [],
              assignment_bank: [],
              archives: [],
            };

      const totalTaskCount =
        taskGroups.operational.reduce((sum, tg) => sum + tg.task_count, 0) +
        taskGroups.assignment_bank.reduce((sum, tg) => sum + tg.task_count, 0) +
        taskGroups.archives.reduce((sum, tg) => sum + tg.task_count, 0);

      return res.status(200).json({
        success: true,
        data: taskGroups,
        count: {
          operational: taskGroups.operational.length,
          assignment_bank: taskGroups.assignment_bank.length,
          archives: taskGroups.archives.length,
          total_task_count: totalTaskCount,
        },
      });
    } catch (error) {
      catchError(error, req, res);
    }
},

  async getTaskGroupByAxisIdAndCourseBatchToCalendar(req, res) {
    try {
      const { axisId, courseBatchId } = req.params;

      if (!axisId) {
        return res.status(400).json({
          error: "axisId הוא שדה חובה",
        });
      }
      if (!courseBatchId) {
        return res.status(400).json({
          error: "courseBatchId הוא שדה חובה",
        });
      }
      const numericAxisIds = axisId
        .split(",")
        .map((id) => Number(id.trim()))
        .filter((id) => !isNaN(id));
      if (numericAxisIds.length === 0) {
        return res.json([]);
      }
      const numericCourseBatchId = Number(courseBatchId);
      if (isNaN(numericCourseBatchId)) {
        return res.status(400).json({
          error: "courseBatchId חייב להיות מספר תקין",
        });
      }
      const query = `
      WITH task_group_data AS (
        SELECT 
          tg.id,
          tg.name,
          tg.status,
          tg."axisId",
          tg."team_id",
          a.name as axis_name,
          a.color as axis_color
        FROM "TaskGroups" tg
        LEFT JOIN "TaskGroupBatchStatus" tgb ON tg.id = tgb."taskGroupId"
        LEFT JOIN "CourseBatches" cb ON tgb."course_batch_id" = cb.id
        LEFT JOIN "Axes" a ON tg."axisId" = a.id
        WHERE tg."axisId" IN (:axisIds)
          AND tgb."course_batch_id" = :courseBatchId
      )
      SELECT 
        JSON_BUILD_OBJECT(
          'operational', ARRAY(
            SELECT JSON_BUILD_OBJECT(
              'id', tg.id,
              'name', tg.name,
              'status', tg.status,
              'axisId', tg."axisId",
              'team_id', tg."team_id",
              'axisName', tg.axis_name,
               'axisColor', tg.axis_color, 
              'tasks', ARRAY(
                SELECT JSON_BUILD_OBJECT(
                  'taskId', t.id,
                  'taskName', t.name,
                  'status',t.status
                )
                FROM "Tasks" t
                WHERE t."taskGroupId" = tg.id
              )
            )
            FROM task_group_data tg
            WHERE tg.id IN (
              SELECT DISTINCT tg2.id 
              FROM "TaskGroups" tg2
              JOIN "TaskGroupBatchStatus" tgb2 ON tg2.id = tgb2."taskGroupId"
              WHERE tgb2."status" = 'operational' AND tgb2."course_batch_id" = :courseBatchId
            )
          )
        ) as result
      FROM task_group_data
      LIMIT 1
    `;
      const result = await sequelize.query(query, {
        replacements: {
          axisIds: numericAxisIds,
          courseBatchId: numericCourseBatchId,
        },
        type: sequelize.QueryTypes.SELECT,
      });

      const taskGroups =
        result.length > 0
          ? result[0].result
          : {
              operational: [],
            };

      return res.status(200).json({
        success: true,
        data: taskGroups,
        count: {
          operational: taskGroups.operational.length,
        },
      });
    } catch (error) {
      catchError(error, req, res);
    }
  },
};
