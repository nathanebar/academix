'use strict';
module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('FormSubmissionAnswers', {
      id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },
      form_submission_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'FormSubmissions',
          key: 'id',
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
      },
      form_question_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'FormQuestions',
          key: 'id',
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
      },
      selected_option_id: {
        type: Sequelize.INTEGER,
        allowNull: true,
        references: {
          model: 'FormOptions',
          key: 'id',
        },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL',
      },
      value_text: {
        type: Sequelize.STRING,
        allowNull: true,
      },
      left_option_id: {
        type: Sequelize.INTEGER,
        allowNull: true,
      },
      right_option_id: {
        type: Sequelize.INTEGER,
        allowNull: true,
      },
      value_number: {
        type: Sequelize.INTEGER,
        allowNull: true,
      },
      pointEarned: {
        type: Sequelize.INTEGER,
        allowNull: true,
      },
      instructor_note: {
        type: Sequelize.STRING,
        allowNull: true,
      },
      createdAt: {
        allowNull: false,
        type: Sequelize.DATE,
          defaultValue: Sequelize.literal('NOW()')
      },
      updatedAt: {
        allowNull: false,
        type: Sequelize.DATE,
          defaultValue: Sequelize.literal('NOW()')
      }
    });
  },
  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable('FormSubmissionAnswers');
  }
};