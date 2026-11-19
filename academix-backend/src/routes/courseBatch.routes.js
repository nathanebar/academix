const express = require('express');
const router = express.Router();
const courseBatchController = require('../controllers/courseBatch.controller');

router.get('/getAllowedCourseBatches', courseBatchController.getAllowedCourseBatches);
router.get('/', courseBatchController.getAll);
router.get('/:id', courseBatchController.getById);
router.post('/', courseBatchController.create);
router.put('/:id', courseBatchController.update);
router.delete('/:id', courseBatchController.remove);

module.exports = router;
