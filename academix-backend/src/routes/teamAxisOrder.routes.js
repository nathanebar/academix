"use strict";

const router = require('express').Router();
const teamAxisOrderController = require("../controllers/teamAxisOrderController");
router.get("/", teamAxisOrderController.getAxesOrdered);

// // עדכון סדר צירים (גרירה)
// // POST /api/team-axis-order
router.post("/", teamAxisOrderController.updateOrder);

// // שליפת צירים עם הסדר המותאם
// // GET /api/team-axis-order/axes?courseBatchId=1&teamId=2&repositoryKind=operational
// router.get("/axes", teamAxisOrderController.getAxesWithOrder);

// // מחיקת סדר מותאם
// // DELETE /api/team-axis-order?courseBatchId=1&teamId=2
// router.delete("/", teamAxisOrderController.deleteOrder);

module.exports = router;