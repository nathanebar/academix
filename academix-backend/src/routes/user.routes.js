const express = require('express');
const router = express.Router();
const userController = require('../controllers/user.controller');

router.get('/getUserData/:username',userController.getUserData)
router.get("/getUserPhoto/:username", userController.getUserPhoto);
router.get('/', userController.getAllUsers);
router.get('/:id', userController.getUserById);
router.post('/', userController.createUser);
router.put('/updateUser/:id', userController.updateUser);
router.delete('/deleteUser/:id', userController.deleteUser);
router.get('/by-username/:username', userController.getUserByUsername);

module.exports = router;
