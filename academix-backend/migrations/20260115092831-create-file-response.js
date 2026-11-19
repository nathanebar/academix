'use strict';
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('FileResponses', {
     
      id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true,
        allowNull: false,
      },
      task_assignments_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
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
    await queryInterface.dropTable('FileResponses');
  },
};