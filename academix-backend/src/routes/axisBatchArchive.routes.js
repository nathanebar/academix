const express = require('express');
const router = express.Router();
const axisBatchArchiveController = require('../controllers/axisBatchArchive.controller');

router.get('/getAllowedAxisBatchArchives', axisBatchArchiveController.getAllowedAxisBatchArchive);
// router.get('/', courseBatchController.getAll);
// router.get('/:id', courseBatchController.getById);
// router.post('/', courseBatchController.create);
// router.put('/:id', courseBatchController.update);
// router.delete('/:id', courseBatchController.remove);

module.exports = router;
