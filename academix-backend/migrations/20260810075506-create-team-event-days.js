// migrations/20XXXXXXXXXX-create-team-event-days.js
'use strict';
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('TeamEventDays', {
      id: {
        type: Sequelize.INTEGER,
        autoIncrement: true,
        primaryKey: true,
        allowNull: false,
      },
      team_event_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'TeamEvents',
          key: 'id',
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
      },
      day_num: {
        type: Sequelize.INTEGER,
        allowNull: false,
      },
      created_at: {
        type: Sequelize.DATE,
        allowNull: false,
      },
      updated_at: {
        type: Sequelize.DATE,
        allowNull: false,
      },
    });
    await queryInterface.addIndex('TeamEventDays', ['team_event_id']);
    await queryInterface.addIndex('TeamEventDays', ['day_num']);
  },
  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('TeamEventDays');
  },
};