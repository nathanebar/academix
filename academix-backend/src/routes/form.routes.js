const router = require('express').Router();
const formController = require('../controllers/form.controller');

router.get('/', formController.getAll);
router.get('/userId/:userId', formController.getFormsByUser);
router.get('/formId/:formId', formController.getByFormId);
// Old path, missing a "/" (it matches /formId123). Still used by the frontend: remove it once
// the frontend calls /formId/:formId.
router.get('/formId:formId', formController.getByFormId);
router.get("/formByTaskAssignmentId", formController.getByTaskAssignmentId);
router.get('/getAllByCourseIdAndTeamId/:courseId', formController.getAllByCourseIdAndTeamId);
router.get("/getUsersInSameTeamAndTask", formController.getUsersInSameTeamAndTask);
router.post("/create", formController.createForm)
router.put("/update/:formId", formController.updateForm)
router.get("/getAllForms", formController.getAllForms);
router.get(
  "/getSurveyDashboard/:courseId",
  formController.getSurveyDashboard
);
router.put('/:id/toggle-active', formController.toggleFormActive);
router.post("/duplicate/:formId", formController.duplicateForm)
router.get("/getFormsForPicker/:courseId", formController.getFormsForPicker);
module.exports = router;
