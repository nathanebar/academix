"use strict";
const { TeamAxisOrder, TeamCourseBatch, Axis } = require("../../models");
const { Op } = require("sequelize");

// ============================================
// 🔥 שליפת סדר צירים לפי courseBatchId + teamId
// ============================================
exports.getAxesOrdered = async (req, res) => {
  try {
    const { courseBatchId, teamId } = req.query;

    if (!courseBatchId || !teamId) {
      return res.status(400).json({ 
        error: "courseBatchId and teamId are required" 
      });
    }

    // שליפת ה-ID מהטבלה TeamCourseBatches
    const teamCourseBatch = await TeamCourseBatch.findOne({
      where: {
        course_batch_id: courseBatchId,
        team_id: teamId,
      },
      raw: true,
    });

    // אם אין רשומה - אין סדר מותאם
    if (!teamCourseBatch) {
      return res.json({
        teamCourseBatchId: null,
        hasCustomOrder: false,
        orders: [],
      });
    }

    // שליפת הסדר המותאם של הצירים
    const teamAxisOrders = await TeamAxisOrder.findAll({
      where: { team_course_batch_id: teamCourseBatch.id },
      order: [["display_order", "ASC"]],
      raw: true,
    });

    // אם אין סדר מותאם
    if (!teamAxisOrders || teamAxisOrders.length === 0) {
      return res.json({
        teamCourseBatchId: teamCourseBatch.id,
        hasCustomOrder: false,
        orders: [],
      });
    }

    res.json({
      teamCourseBatchId: teamCourseBatch.id,
      hasCustomOrder: true,
      orders: teamAxisOrders.map((order) => ({
        axis_id: order.axis_id,
        display_order: order.display_order,
      })),
    });
  } catch (error) {
    console.error("Error fetching axes order:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

// ============================================
// 🔥 עדכון סדר צירים
// ============================================
exports.updateOrder = async (req, res) => {
  const { courseBatchId, teamId, axisIds } = req.body;

  try {
    if (!courseBatchId || !teamId || !axisIds || !Array.isArray(axisIds)) {
      return res.status(400).json({ error: "Invalid parameters" });
    }

    // מציאת או יצירת TeamCourseBatch
    const [teamCourseBatch, created] = await TeamCourseBatch.findOrCreate({
      where: {
        course_batch_id: courseBatchId,
        team_id: teamId,
      },
      defaults: {
        course_batch_id: courseBatchId,
        team_id: teamId,
      },
    });

    // מחיקת הסדר הקיים
    await TeamAxisOrder.destroy({
      where: { team_course_batch_id: teamCourseBatch.id },
    });

    // יצירת סדר חדש
    const records = axisIds.map((axisId, index) => ({
      team_course_batch_id: teamCourseBatch.id,
      axis_id: axisId,
      display_order: index,
    }));

    await TeamAxisOrder.bulkCreate(records);

    logger.info('TeamAxisOrder updated', {
      teamCourseBatchId: teamCourseBatch.id,
      courseBatchId: courseBatchId,
      teamId: teamId,
      axesCount: axisIds.length,
      axisIds: axisIds,
      userId: req.headers['x-user-id']
    });

    res.json({ 
      success: true,
      teamCourseBatchId: teamCourseBatch.id,
    });
  } catch (error) {
    console.error("Error updating order:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

// // ============================================
// // 🔥 שליפת צירים עם הסדר המותאם
// // ============================================
// exports.getAxesWithOrder = async (req, res) => {
//   try {
//     const { courseBatchId, teamId, repositoryKind } = req.query;

//     if (!courseBatchId || !teamId) {
//       return res.status(400).json({ 
//         error: "courseBatchId and teamId are required" 
//       });
//     }

//     // מציאת TeamCourseBatch
//     const teamCourseBatch = await TeamCourseBatch.findOne({
//       where: {
//         course_batch_id: courseBatchId,
//         team_id: teamId,
//       },
//       raw: true,
//     });

//     // תנאים בסיסיים לשליפת צירים
//     const whereClause = {};

//     // סינון לפי team
//     whereClause.team_id = { [Op.or]: [null, teamId] };

//     // סינון לפי repository_kind
//     if (repositoryKind === "operational") {
//       whereClause.repository_kind = "operational";
//     } else if (repositoryKind === "assignment_bank") {
//       whereClause.repository_kind = { [Op.ne]: "archives" };
//     }
//     // אם archives - לא מוסיפים תנאי

//     // שליפת הצירים
//     let axes = await Axis.findAll({
//       where: whereClause,
//       order: [["id", "ASC"]],
//       raw: true,
//     });

//     // אם יש teamCourseBatch - מסדר לפי הסדר המותאם
//     if (teamCourseBatch) {
//       const teamAxisOrders = await TeamAxisOrder.findAll({
//         where: { team_course_batch_id: teamCourseBatch.id },
//         order: [["display_order", "ASC"]],
//         raw: true,
//       });

//       if (teamAxisOrders && teamAxisOrders.length > 0) {
//         const orderMap = new Map(
//           teamAxisOrders.map((order) => [order.axis_id, order.display_order])
//         );

//         const orderedAxes = [];
//         const unorderedAxes = [];

//         axes.forEach((axis) => {
//           if (orderMap.has(axis.id)) {
//             orderedAxes.push({
//               ...axis,
//               _display_order: orderMap.get(axis.id),
//             });
//           } else {
//             unorderedAxes.push(axis);
//           }
//         });

//         orderedAxes.sort((a, b) => a._display_order - b._display_order);
//         axes = [...orderedAxes, ...unorderedAxes].map(({ _display_order, ...axis }) => axis);
//       }
//     }

//     res.json(axes);
//   } catch (error) {
//     console.error("Error fetching axes with order:", error);
//     res.status(500).json({ error: "Internal server error" });
//   }
// };

// // ============================================
// // 🔥 מחיקת סדר מותאם
// // ============================================
// exports.deleteOrder = async (req, res) => {
//   try {
//     const { courseBatchId, teamId } = req.query;

//     if (!courseBatchId || !teamId) {
//       return res.status(400).json({ 
//         error: "courseBatchId and teamId are required" 
//       });
//     }

//     const teamCourseBatch = await TeamCourseBatch.findOne({
//       where: {
//         course_batch_id: courseBatchId,
//         team_id: teamId,
//       },
//     });

//     if (teamCourseBatch) {
//       await TeamAxisOrder.destroy({
//         where: { team_course_batch_id: teamCourseBatch.id },
//       });
//     }

//     res.json({ success: true });
//   } catch (error) {
//     console.error("Error deleting order:", error);
//     res.status(500).json({ error: "Internal server error" });
//   }
// };