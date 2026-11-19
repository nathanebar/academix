"use strict";

const { NOW } = require("sequelize");
const gradeStage = require("../models/gradeStage");

module.exports = {
    async up(queryInterface, Sequelize) {
        await queryInterface.createTable("AxisTemplates", {
            id: {
                allowNull: false,
                autoIncrement: true,
                primaryKey: true,
                type: Sequelize.BIGINT,
            },
            axisId: {

                type: Sequelize.INTEGER,
                allowNull: false,
                references: {
                    model: 'Axes',
                    key: 'id'
                }, onDelete: "CASCADE"


            },
            files: {
                type: Sequelize.BOOLEAN,
                allowNull: false,
                defaultValue: false
            },
            checklist: {
                type: Sequelize.BOOLEAN,
                allowNull: false,
                defaultValue: false
            },
            link: {
                type: Sequelize.BOOLEAN,
                allowNull: false,
                defaultValue: false
            }, gradeStage: {
                type: Sequelize.BOOLEAN,
                allowNull: false,
                defaultValue: false
            }, duration: {
                type: Sequelize.BOOLEAN,
                allowNull: false,
                defaultValue: false
            }, feedBack: {
                type: Sequelize.BOOLEAN,
                allowNull: false,
                defaultValue: false
            }, Form: {
                type: Sequelize.BOOLEAN,
                allowNull: false,
                defaultValue: false
            },
            FileResponse: {
                type: Sequelize.BOOLEAN,
                allowNull: false,
                defaultValue: false
            },
            SolutionFile: {
                type: Sequelize.BOOLEAN,
                allowNull: false,
                defaultValue: false
            },
              color: {                   
                type: Sequelize.BOOLEAN,
                allowNull: false,
                defaultValue: false
            },
            tags: {                   
                type: Sequelize.BOOLEAN,
                allowNull: false,
                defaultValue: false
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
        await queryInterface.dropTable("AxisTemplates");
    },
};