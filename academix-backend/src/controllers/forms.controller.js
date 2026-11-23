
const { Form } = require("../../models");
const { catchError } = require("../utils/errorHandler");

exports.getAll = async (req, res) => {
  try {
     const forms = await Form.findAll({});  
    res.status(200).json(forms);
  } catch (err) {
    catchError(err, req, res, { function: "forms.getAll" });
  }
};