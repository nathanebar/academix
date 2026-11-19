'use strict';
module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('FormSubmissions', {
      id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true,
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
      form_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'Forms',
          key: 'id',
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
      },
      started_at: {
        type: Sequelize.DATE,
        allowNull: true,
      },
      submitted_at: {
        type: Sequelize.DATE,
        allowNull: true,
      },
    
      score: {
        type: Sequelize.INTEGER,
        allowNull: true,
      },
      is_published: {
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
  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable('FormSubmissions');
  }
};