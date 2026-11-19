const { Role } = require('../../models');

exports.getAll = async (req, res) => {  
  try {
    
    const roles = await Role.findAll();    
    res.json(roles);

  } catch (error) {
    console.log(error);
    
  }
};
exports.create = async (req, res) => {
      try {
        const newItem = await Role.create(req.body);
        res.status(201).json(newItem);
      } catch (err) {
        res.status(400).json({ error: err.message });
      }
    };
