
const { AxisTemplate } = require("../../models");
const logger = require("../utils/logger");
const { catchError } = require("../utils/errorHandler");

exports.getByAxisId = async (req, res) => {
    try {
        const AxisTemplateById = await AxisTemplate.findAll({
            where: {
                axisId: req.query.axisId
            }
        });
        res.json(AxisTemplateById);

    } catch (err) {
        catchError(err, req, res, { function: "axisTemplate.getByAxisId" });
    }
};

exports.getById = async (req, res) => {
    try {
        // The local const used to be named AxisTemplate too: it shadowed the model, so this always threw.
        const axisTemplate = await AxisTemplate.findByPk(req.params.id);
        if (!axisTemplate) return res.status(404).json({ error: "AxisTemplate not found" });
        res.json(axisTemplate);
    } catch (err) {
        res.status(500).json({ error: "Failed to fetch AxisTemplate" });
    }
};

exports.create = async (req, res) => {



    try {
        const newAxisTemplate = await AxisTemplate.create(req.body,);
        logger.info('AxisTemplate created', {
            axisTemplateId: newAxisTemplate.id,
            axisId: req.body.axisId,
            userId: req.headers['x-user-id']
        });
        res.status(200).json(newAxisTemplate);
    } catch (err) {
        logger.error("axisTemplate.create failed", { originalError: err.message, stack: err.stack });

        res.status(400).json({ error: "Failed to create AxisTemplate" });
    }
};
exports.update = async (req, res) => {
  try {
    // 👈 שנה את המשתנה - update מחזיר מערך [count]
    const [updatedCount] = await AxisTemplate.update(
      { ...req.body },
      {
        where: {
          axisId: req.body.axisId
        }
      }
    );

    logger.info('AxisTemplate updated', {
      axisId: req.body.axisId,
      updatedRows: updatedCount,  // ✅ עכשיו מוגדר
      userId: req.headers['x-user-id']
    });

    res.status(200).json({ updatedCount });
  } catch (err) {
    logger.error("axisTemplate.update failed", { originalError: err.message, stack: err.stack });
    res.status(400).json({ error: "Failed to update AxisTemplate" });
  }
};