"use strict";

const {
  FormSubmission,
  TaskAssignment,
  Form,
  User,
  FormSubmissionAnswer,
} = require("../../models");
const { createMany } = require("./formSubmissionsAnswers.controller");
const logger = require('../utils/logger');
const { catchError } = require('../utils/errorHandler');

// Get form submission by ID with associations
exports.get = async (req, res) => {
  try {
    const { id } = req.params;

    const formSubmission = await FormSubmission.findByPk(id, {
      include: [
        { model: TaskAssignment, as: "taskAssignment" },
        { model: Form, as: "form" },
        { model: User, as: "user" },
        { model: FormSubmissionAnswer, as: "FormSubmissionAnswers" },
      ],
    });

    if (!formSubmission) {
      return res.status(404).json({
        success: false,
        message: "Form submission not found",
      });
    }

    return res.status(200).json({
      success: true,
      data: formSubmission,
    });
  } catch (error) {
    catchError(error, req, res, { function: 'get', formSubmissionId: req.params.id });
  }
};

// Add new form submission
exports.create = async (req, res) => {
  try {
    const {
      task_assignment_id,
      form_id,
      started_at,
      submitted_at,
      status,
      answers,
    } = req.body;

    // Validate required fields
    if (!task_assignment_id || !form_id) {
      return res.status(400).json({
        success: false,
        message:
          "Missing required fields: task_assignment_id, form_id, user_answer_id",
      });
    }

    const existingSubmission = await FormSubmission.findOne({
      where: {
        task_assignment_id: task_assignment_id,
        form_id: form_id
      },
    });

    if (existingSubmission) {
      return res.status(409).json({
        success: false,
        message:
          "submission to this task assignment already exist!",
      });
    }

    // Create new form submission
    const submission = await FormSubmission.create({
      task_assignment_id,
      form_id,
      started_at,
      submitted_at,
      status,
    });

    const updatedAnswers = answers?.map((a) => ({
      ...a,
      form_submission_id: submission?.id,
    }));

    const submissionAnswers = await createMany(updatedAnswers);

   
    if (submission) {
      logger.info('FormSubmission created', {
        formSubmissionId: submission.id,
        formId: form_id,
        taskAssignmentId: task_assignment_id,
        answersCount: answers?.length || 0,
        userId: req.headers['x-user-id']
      });

      return res.status(201).json({
        success: true,
        message: "Form submission created successfully",
      });
    }
    return res.status(409).json({
      success: false,
      message: "Form submission or Form submission Answers not found",
      error: submissionAnswers?.error,
    });
  } catch (error) {
    catchError(error, req, res, { function: 'create', taskAssignmentId: req.body.task_assignment_id, formId: req.body.form_id });
  }
};

// Update form submission
exports.update = async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body;

    // Find form submission by ID
    const formSubmission = await FormSubmission.findByPk(id);

    if (!formSubmission) {
      return res.status(404).json({
        success: false,
        message: "Form submission not found",
      });
    }

    // Update form submission
    await formSubmission.update(updateData);

    logger.info('FormSubmission updated', {
      formSubmissionId: id,
      updatedFields: Object.keys(updateData),
      userId: req.headers['x-user-id']
    });

    // Return updated form submission
    const updatedFormSubmission = await FormSubmission.findByPk(id, {
      include: [
        { model: TaskAssignment, as: "taskAssignment" },
        { model: Form, as: "form" },
        // { model: User, as: "user" },
        { model: FormSubmissionAnswer, as: "FormSubmissionAnswers" },
      ],
    });

    return res.status(200).json({
      success: true,
      message: "Form submission updated successfully",
      data: updatedFormSubmission,
    });
  } catch (error) {
    catchError(error, req, res, { function: 'update', formSubmissionId: req.params.id });
  }
};

// Delete form submission
exports.delete = async (req, res) => {
  try {
    const { id } = req.params;

    // Find form submission by ID
    const formSubmission = await FormSubmission.findByPk(id);

    if (!formSubmission) {
      return res.status(404).json({
        success: false,
        message: "Form submission not found",
      });
    }

    // Delete form submission
    await formSubmission.destroy();

    logger.info('FormSubmission deleted', {
      formSubmissionId: id,
      formId: formSubmission.form_id,
      taskAssignmentId: formSubmission.task_assignment_id,
      userId: req.headers['x-user-id']
    });

    return res.status(200).json({
      success: true,
      message: "Form submission deleted successfully",
    });
  } catch (error) {
    catchError(error, req, res, { function: 'delete', formSubmissionId: req.params.id });
  }
};
