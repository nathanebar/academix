const { body, validationResult } = require('express-validator');

const validateUser = [
  body('username')
    .notEmpty().withMessage('Username is required')
    .isLength({ min: 3 }).withMessage('Username must be at least 3 characters'),
  body('fullName')
    .notEmpty().withMessage('Full name is required'),
  body('role')
    .optional()
    .isIn(['admin', "readonly"]).withMessage('Role must be either "admin" or "readonly"'),
  body('devices')
    .optional()
    .isArray().withMessage('Devices must be an array of ObjectIds'),
  body('devices.*')
    .optional()
    .isMongoId().withMessage('Each device must be a valid Mongo ObjectId'),
  (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      res.status(400).json({ errors: errors.array() });
      return
    }
    next();
  }
];

module.exports = validateUser;