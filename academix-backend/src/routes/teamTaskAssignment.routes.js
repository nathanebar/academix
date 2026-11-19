const express = require('express');
const router = express.Router();
const TeamTaskAssignmentController = require('../controllers/TeamTaskAssignment.controller');


router.post('/', TeamTaskAssignmentController.create);

router.get('/', TeamTaskAssignmentController.getAll);

router.get('/:id', TeamTaskAssignmentController.getById);

router.put('/:id', TeamTaskAssignmentController.update);

router.delete('/:id', TeamTaskAssignmentController.delete);

module.exports = router;