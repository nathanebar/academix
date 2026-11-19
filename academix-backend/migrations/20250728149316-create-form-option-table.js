'use strict';
module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('FormOptions', {
      id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },
      question_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'FormQuestions',
          key: 'id',
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
      },
      option_text: {
        type: Sequelize.TEXT,
        allowNull: false,
      },
      paireKey: {
        type: Sequelize.STRING,
        allowNull: true,
      },
      side: {
        type: Sequelize.ENUM('left', 'right', 'none'),
        allowNull: true,
        defaultValue: 'none',
      },
      is_correct: {
        type: Sequelize.BOOLEAN,
        defaultValue: null,
      },
      orderIndex: {
        type: Sequelize.INTEGER,
        allowNull: true,
      },
      points: {
        type: Sequelize.INTEGER,
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
    await queryInterface.dropTable('FormOptions');
  }
};