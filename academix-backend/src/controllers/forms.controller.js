
const { Form } = require("../../models");

exports.getAll = async (req, res) => {
  try {
     const forms = await Form.findAll({});  
    res.status(200).json(forms);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};