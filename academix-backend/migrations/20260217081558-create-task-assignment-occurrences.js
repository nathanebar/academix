'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('TaskAssignmentOccurrences', {
      id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true,
        allowNull: false,
      },
      task_assignment_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'TaskAssignments',
          key: 'id',
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
      },
      start: {
        type: Sequelize.DATE,
        allowNull: true,
      },
      end: {
        type: Sequelize.DATE,
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

    // await queryInterface.addIndex('TaskAssignmentOccurrences', ['task_assignment_id']);
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable('TaskAssignmentOccurrences');
  },
};