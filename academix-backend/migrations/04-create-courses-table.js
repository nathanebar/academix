'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('Courses', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER
      },
      domainId: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'Domains',
          key: 'id'
        },
        onDelete: 'CASCADE' // <- כאן הוסף את ה-CASCADE
      },
      name: {
        type: Sequelize.STRING,
        allowNull: false
      },
    
      duration_months: {
        type: Sequelize.INTEGER
      },
      description: {
        type: Sequelize.STRING
      },
      location: {
        type: Sequelize.STRING
      },
      targets: {
        type: Sequelize.STRING
      },
      requirements: {
        type: Sequelize.STRING
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
    await queryInterface.dropTable('Courses');
  }
};