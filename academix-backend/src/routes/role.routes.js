const router = require('express').Router();
const roleController = require('../controllers/role.controller');

router.get('/', roleController.getAll);
router.post('/', roleController.create);

module.exports = router;
