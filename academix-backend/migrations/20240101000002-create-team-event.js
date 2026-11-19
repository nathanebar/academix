// migrations/20240101000001-create-team-event.js
"use strict";

module.exports = {
    async up(queryInterface, Sequelize) {
        await queryInterface.createTable(
            "TeamEvents",
            {
                id: {
                    type: Sequelize.INTEGER,
                    allowNull: false,
                    autoIncrement: true,
                    primaryKey: true,
                },
                teamCourseBatchId: {
                    type: Sequelize.INTEGER,
                    allowNull: true, field: 'teamCourseBatchId',
                    references: {
                        model: "TeamCourseBatches",
                        key: "id",
                    },
                    onUpdate: "CASCADE",
                    onDelete: "CASCADE",
                }, startHour: {
                    type: Sequelize.INTEGER,


                }, endHour: {
                    type: Sequelize.INTEGER,


                },
                startDate: {
                    type: Sequelize.DATE,


                }, endDate: {
                    type: Sequelize.DATE,


                },
                constant: {
                    type: Sequelize.BOOLEAN,
                    allowNull: true,
                },
                color: {
                    type: Sequelize.TEXT,
                    allowNull: false,
                },
                recommendedTime: {
                    type: Sequelize.INTEGER,
                    defaultValue: 60,
                },
                title: {
                    type: Sequelize.TEXT,
                    allowNull: false,
                },
                createdAt: {
                    type: Sequelize.DATE,
                    allowNull: false,
                    defaultValue: Sequelize.literal("CURRENT_TIMESTAMP"),
                },
                updatedAt: {
                    type: Sequelize.DATE,
                    allowNull: false,
                    defaultValue: Sequelize.literal("CURRENT_TIMESTAMP"),
                },
            },
            {

                modelName: "TeamEvent",
                tableName: "TeamEvents",
                timestamps: true,
            }
        );
    },

    async down(queryInterface, Sequelize) {
        await queryInterface.dropTable("TeamEvents");
    },
};