'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {

    await queryInterface.createTable('AssignmentProgress', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER
      },
      task_assignment_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'TaskAssignments',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      },
      progress_type: {
        type: Sequelize.ENUM('form', 'link', 'checklist', 'file', 'filesResponse'),
        allowNull: false
      },
      item_id: {
        type: Sequelize.INTEGER,
        allowNull: true
      },
      status: {
        type: Sequelize.INTEGER,
        allowNull: false,
        validate: {
          min: 1,
          max: 100
        },
        defaultValue: 1
      },
      completed_at: {
        type: Sequelize.DATE,
        allowNull: true
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
    // מחיקת הטבלה
    await queryInterface.dropTable('assignment_progress');
  }
};