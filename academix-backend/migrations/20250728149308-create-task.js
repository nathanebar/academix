"use strict";

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable("Tasks", {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.BIGINT,
      },
      name: {
        type: Sequelize.STRING(255),
        allowNull: false,
      },
      taskGroupId: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: "TaskGroups",
          key: "id",
        },
        onUpdate: "CASCADE",
        onDelete: "CASCADE",
      },
      creatorId: {
        type: Sequelize.INTEGER,
        allowNull: true,
        references: {
          model: "Users",
          key: "id",
        },
        onUpdate: "CASCADE",
        onDelete: "SET NULL",
      },
      description: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      description_to_overlap: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      status: {
        type: Sequelize.ENUM("operational", "assignment_bank", "archives"),
        defaultValue: "operational",
        allowNull: false,
      },
      recommendedTime: {
        type: Sequelize.INTEGER,
        allowNull: true,
      },
      filesResponse: {
        type: Sequelize.BOOLEAN,
        allowNull: true,
      },
      //   solution_file_id: {
      //   type: Sequelize.INTEGER,
      //   allowNull: true,
      //   references: {
      //     model: "Files",
      //     key: "id",
      //   },
      //   onUpdate: "CASCADE",
      //   onDelete: "CASCADE",
      // },
      gradeStageId: {
        type: Sequelize.INTEGER,
        allowNull: true,
        // need to be done after we open GradeStage table 👇
        references: {
          model: "GradeStages",
          key: "id",
        },
      },

      /*   chatId: {
        type: Sequelize.INTEGER,
        allowNull: true,
       
        references: {
          model: 'Chat',
          key: 'id'
        },
      }, */
      formId: {
        type: Sequelize.INTEGER,
        allowNull: true,
        references: {
          model: "Forms",
          key: "id",
        },
        onUpdate: "CASCADE",
        onDelete: "CASCADE",
      },
       surveyId: {
        type: Sequelize.INTEGER,
        allowNull: true,
        references: {
          model: "Forms",
          key: "id",
        },
        onUpdate: "CASCADE",
        onDelete: "SET NULL",
      },
      feedbackId: {
        type: Sequelize.INTEGER,
        allowNull: true,
        // need to be done after we open Feedback table 👇
        // references: {
        //   model: 'Feedback',
        //   key: 'id'
        // },
      },
      hidden: {
        type: Sequelize.BOOLEAN,
        defaultValue: false,
      },
      requiresSubmission: {
        type: Sequelize.BOOLEAN,
        defaultValue: false,
      },
      linkUrl: {
        type: Sequelize.STRING(10000),
        allowNull: true,
      },
      team_id: {
        type: Sequelize.INTEGER,
        allowNull: true,
      },
       is_seen: {
        type: Sequelize.BOOLEAN,
        allowNull: true,
      },
      color: {
        type: Sequelize.STRING(255),
        allowNull: true,
      },
        is_active: {
        type: Sequelize.BOOLEAN,
        allowNull: true,
      },
        exposure: {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: false,
      },
       notRequiredToSubmit: {  
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: false,
      },
       deletedAt: { 
        type: Sequelize.DATE,
        allowNull: true,
        defaultValue: null,
      },
    
      createdAt: {
        allowNull: false,
        type: Sequelize.DATE,
        defaultValue: Sequelize.literal("NOW()"),
      },
      updatedAt: {
        allowNull: false,
        type: Sequelize.DATE,
        defaultValue: Sequelize.literal("NOW()"),
      },
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable("Tasks");
  },
};
