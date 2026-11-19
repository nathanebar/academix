'use strict';
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('Teams', {
      id: {
        type: Sequelize.INTEGER,
        autoIncrement: true,
        primaryKey: true,
        allowNull: false
      },
      name: {
        type: Sequelize.STRING,
        allowNull: false
      },
    /*   course_batch_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'CourseBatches',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      }, */

       courseId: {
        type: Sequelize.INTEGER,
        allowNull: true,
        references: {
          model: "Courses",
          key: "id",
        },
        onUpdate: "CASCADE",
        onDelete: "SET NULL",
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
    await queryInterface.dropTable('Teams');
  }
};