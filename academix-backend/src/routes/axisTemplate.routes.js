const express = require("express");
const { create, getByAxisId, update } = require("../controllers/axisTemplate.controllers");
const router = express.Router();

router.post("/create", create);
router.put("/update", update);
router.get("/get-by-axisId", getByAxisId);
module.exports = router;
