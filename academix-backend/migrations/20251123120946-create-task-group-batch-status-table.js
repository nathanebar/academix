'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('TaskGroupBatchStatus', {
      id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true,
        allowNull: false
      },
      taskGroupId: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'TaskGroups',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      },
      course_batch_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'CourseBatches',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      },
      status: {
        type: Sequelize.ENUM('operational', 'assignment_bank', 'archives'),
        defaultValue: 'operational',
        allowNull: false
      },
      createdAt: {
        allowNull: false,
        type: Sequelize.DATE
      },
      updatedAt: {
        allowNull: false,
        type: Sequelize.DATE
      }
    });
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable('TaskGroupBatchStatus');
  }
};