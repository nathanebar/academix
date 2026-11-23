const { Role } = require('../../models');
const { catchError } = require('../utils/errorHandler');

exports.getAll = async (req, res) => {  
  try {
    
    const roles = await Role.findAll();    
    res.json(roles);

  } catch (error) {
    catchError(error, req, res, { function: "role.getAll" });
  }
};
exports.create = async (req, res) => {
      try {
        const newItem = await Role.create(req.body);
        res.status(201).json(newItem);
      } catch (err) {
        catchError(err, req, res, { function: "role.create", status: 400 });
      }
    };
