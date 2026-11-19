const router = require("express").Router();
const formsController = require("../controllers/forms.controller");

router.get("/getAllForms", formsController.getAll);


module.exports = router;
