const router = require('express').Router();
const formSubmissionsAnswersController = require('../controllers/formSubmissionsAnswers.controller');

router.get('/:id', formSubmissionsAnswersController.get);
router.post('/', formSubmissionsAnswersController.create);
router.put('/:id', formSubmissionsAnswersController.put);


module.exports = router;