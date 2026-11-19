const router = require('express').Router();
const courseBatchFolderFileController = require('../controllers/courseBatchFolderFile.controller');
const multer = require('multer');

const storage = multer.memoryStorage();
const upload = multer({ storage });

router.post('/', upload.single('file'), courseBatchFolderFileController.uploadFile);

router.get('/folder/:folderid', courseBatchFolderFileController.getFilesByFolderId);

router.delete('/:id', courseBatchFolderFileController.deleteFile);

module.exports = router;