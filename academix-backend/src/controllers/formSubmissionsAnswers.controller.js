const { FormSubmissionAnswer, File } = require("../../models");
const { Op } = require("sequelize");
const logger = require('../utils/logger');

module.exports = {
  async create(req, res) {
    const existingFormAnswers = await FormSubmissionAnswer.findOne({
      where: {
        form_submission_id: req.body.form_submission_id,
        form_question_id: req.body.form_question_id,
      },
    });
    if (existingFormAnswers) {
      return res.status(409).json({ msg: "Answer exists already!" });
    }
    try {
      const FormAnswers = await FormSubmissionAnswer.create(req.body);
      
      if (req.body.value_text) {
        await File.update(
          { form_question_id: req.body.form_question_id },
          { where: { s3Key: req.body.value_text } }
        );
      }

       logger.info('FormSubmissionAnswer created', {
        formSubmissionAnswerId: FormAnswers.id,
        formSubmissionId: req.body.form_submission_id,
        formQuestionId: req.body.form_question_id,
        userId: req.headers['x-user-id']
      });
      res.status(201).json(FormAnswers);
    } catch (err) {
      res.status(400).json({ error: err.message });
    }
  },

  async put(req, res) {
    const { id } = req.params;
    const { pointEarned, form_question_id, instructor_note } = req.body;
    const UpdatingFormAnswers = await FormSubmissionAnswer.update(
      { pointEarned, instructor_note },
      {
        where: {
          form_question_id: form_question_id,
          form_submission_id: id,
        },
      }
    );
    if (!UpdatingFormAnswers) return res.status(404).send("Team not found");

    logger.info('FormSubmissionAnswer updated', {
      formSubmissionId: id,
      formQuestionId: form_question_id,
      updatedFields: { pointEarned, instructor_note },
      userId: req.headers['x-user-id']
    });
    res.status(201).json({ msg: "Updated successfully" });
  },

  async createMany(answers) {
    try {
      if (!Array.isArray(answers)) {
        return {
          error: "Request body must be an array of form answers",
        };
      }

      // Check for existing answers first to avoid duplicates
      const existingChecks = answers.map((item) => ({
        form_submission_id: item.form_submission_id,
        form_question_id: item.form_question_id,
      }));
      const existingAnswers = await FormSubmissionAnswer.findAll({
        where: {
          [Op.or]: existingChecks,
        },
      });

      // Create a map of existing combinations for quick lookup
      const existingMap = new Map();
      existingAnswers.forEach((answer) => {
        const key = `${answer.form_submission_id}-${answer.form_question_id}`;
        existingMap.set(key, answer);
      });

      // Filter out duplicates and prepare data for creation
      const validData = answers.filter((item) => {
        const key = `${item.form_submission_id}-${item.form_question_id}`;
        return !existingMap.has(key);
      });

      // If all items exist, return conflict
      if (validData.length === 0) {
        return {
          msg: "All answers already exist!",
        };
      }

      // Create all valid documents
      const createdAnswers = await FormSubmissionAnswer.bulkCreate(validData);
      const answersWithFiles = validData.filter(item => item.value_text);
      
      for (const answer of answersWithFiles) {
        await File.update(
          { form_question_id: answer.form_question_id },
          { where: { s3Key: answer.value_text } }
        );
      }

      logger.info('FormSubmissionAnswers bulk created', {
        formSubmissionId: answers[0]?.form_submission_id,
        createdCount: createdAnswers.length,
        answersCount: answers.length,
        userId: req.headers['x-user-id']
      });

      return {
        message: `${createdAnswers.length} answers created successfully`,
        data: createdAnswers,
      };
    } catch (err) {
      return {
        error: err.message,
      };
    }
  },

  async get(req, res) {
    const { id } = req.params;
    const forms = await FormSubmissionAnswer.findAll({
      where: {
        form_submission_id: id,
      },
    });
    return res.status(200).json(forms);
  },
};