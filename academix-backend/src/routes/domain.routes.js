const express = require('express');
const router = express.Router();
const domainController = require('../controllers/domain.controller');

router.get('/getAllowedDomains', domainController.getAllowedDomains);
router.get('/', domainController.getAllDomains);
router.get('/:id', domainController.getDomainById);
router.post('/', domainController.createDomain);
router.put('/:id', domainController.updateDomain);
router.delete('/:id', domainController.deleteDomain);

module.exports = router;
