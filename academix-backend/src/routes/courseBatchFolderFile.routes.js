const router = require('express').Router();
const courseBatchFolderFileController = require('../controllers/courseBatchFolderFile.controller');
const { singleFile } = require('../middlewares/upload');

router.post('/', singleFile('file'), courseBatchFolderFileController.uploadFile);

router.get('/folder/:folderid', courseBatchFolderFileController.getFilesByFolderId);

router.delete('/:id', courseBatchFolderFileController.deleteFile);

module.exports = router;