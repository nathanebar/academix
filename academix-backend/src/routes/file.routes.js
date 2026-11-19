const router = require("express").Router();
const fileController = require("../controllers/file.controller");

const multer = require("multer");

const storage = multer.memoryStorage();
const upload = multer({ storage });

router.get("/stream-file", fileController.streamFile);
router.get("/download-file", fileController.downloadFile); 
router.get("/filesById", fileController.getFileById);
router.get("/filesByTaskId", fileController.getFilesByTaskId);
router.get("/filesByCourseBatchId", fileController.getFilesByCourseBatchId); 
router.get(
  "/filesByFeedbackAnswerId",
  fileController.getFilesByFeedbackAnswerId
);
router.post("/upload-file", upload.single("file"), fileController.uploadFile);
router.post("/create-bucket", fileController.createBucket);
router.delete("/by-feedback", fileController.deleteByFeedback);
router.delete("/delete-file", async (req, res) => {
  const response = await fileController.deleteFile(req.headers.id);
  res.status(response.status).json(response);
});
router.delete("/deleteAllFilesByTaskId", fileController.deleteAllFilesByTaskId);



module.exports = router;
