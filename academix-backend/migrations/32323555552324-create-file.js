"use strict";
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable("Files", {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.BIGINT,
      },
      task_id: {
        type: Sequelize.INTEGER,
        allowNull: true,
        references: {
          model: "Tasks",
          key: "id",
        },
        onUpdate: "CASCADE",
        onDelete: "CASCADE",
      },
       feedback_answer_id: {
        type: Sequelize.INTEGER,
        allowNull: true,                    
        references: {
          model: "FeedbackAnswers",    
          key: "id",
        },
        onUpdate: "CASCADE",
        onDelete: "CASCADE",              
      },
      task_assignment_id: {
        type: Sequelize.INTEGER,
        allowNull: true,                    
        references: {
          model: "TaskAssignments",    
          key: "id",
        },
        onUpdate: "CASCADE",
        onDelete: "CASCADE",              
      },
       form_question_id: { 
        type: Sequelize.INTEGER,
        allowNull: true,
        references: {
          model: 'FormQuestions',
          key: 'id',
        },
          onUpdate: "CASCADE",
        onDelete: "CASCADE", 
      },
      isFileResponse: {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: false
      },
      s3BucketName: {
        type: Sequelize.STRING,
        allowNull: false,
      },
      name: {
        type: Sequelize.STRING,
        allowNull: false,
      },
      size: {
        type: Sequelize.INTEGER,
        allowNull: false,
      },
      length: {
        type: Sequelize.DOUBLE,
        allowNull: true,
      },
      type: {
        type: Sequelize.STRING,
        allowNull: false,
      },
      s3Key: {
        type: Sequelize.STRING,
        allowNull: false,
      },
      isPatbass: {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: false,
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
  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable("Files");
  },
};