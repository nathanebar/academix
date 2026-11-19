'use strict';
module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('Roles', {
       code: {
        type: Sequelize.STRING,
        primaryKey: true,
        allowNull: false
      },
      name_he: {
        type: Sequelize.STRING,
        allowNull: false
      },
      name_en: {
        type: Sequelize.STRING,
        allowNull: false
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
    await queryInterface.bulkDelete('Roles', null, {});
    await queryInterface.dropTable('Roles');
  }
};