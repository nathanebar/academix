const router = require('express').Router();
const roleAssignmentController = require('../controllers/roleAssignment.controller');

router.get('/', roleAssignmentController.getAll);
router.get('/getAllByUser', roleAssignmentController.getAllByUser);
router.get('/:id', roleAssignmentController.getById);
router.get('/getCourseCommander/:id', roleAssignmentController.getCourseComnmander);
router.post('/', roleAssignmentController.create);
router.put('/:id', roleAssignmentController.update);
router.delete('/:userId/:scopeId', roleAssignmentController.remove);

module.exports = router;
