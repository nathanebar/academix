const router = require('express').Router();
const courseBatchFolderController = require('../controllers/courseBatchFolder.controller');

router.get('/', courseBatchFolderController.getFolders);

router.get('/:id', courseBatchFolderController.getFolderById);

router.post('/', courseBatchFolderController.createFolder);

router.put('/:id', courseBatchFolderController.updateFolder);

router.delete('/:id', courseBatchFolderController.deleteFolder);

module.exports = router;