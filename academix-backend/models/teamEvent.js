// models/TeamEvent.js
"use strict";
const { Model } = require("sequelize");
module.exports = (sequelize, DataTypes) => {
    class TeamEvent extends Model {
        /**
         * Associations
         */
        static associate(models) {
            this.belongsTo(models.TeamCourseBatch, {
                foreignKey: "teamCourseBatchId",
                as: "teamCourseBatch",
            });
            this.hasMany(models.TeamEventDay, {
                foreignKey: "teamEventId",
                as: "days",
            });
        }
    }
    TeamEvent.init(
        {
            id: {
                type: DataTypes.INTEGER,
                autoIncrement: true,
                primaryKey: true,
                allowNull: false,
            },
            teamCourseBatchId: {
                type: DataTypes.INTEGER,
                allowNull: true,
                references: {
                    model: "TeamCourseBatches",
                    key: "id",
                },
                onUpdate: "CASCADE",
                onDelete: "CASCADE",
            },
            recommendedTime: {
                type: DataTypes.INTEGER,
                allowNull: false,
            },
            color: {
                type: DataTypes.TEXT,
                allowNull: false,
            },
            constant: {
                type: DataTypes.BOOLEAN,
                allowNull: true,
            },
            title: {
                type: DataTypes.TEXT,
                allowNull: false,
            }, startDate: {
                type: DataTypes.DATE,
                allowNull: true,

            },
            startHour: {
                type: DataTypes.INTEGER,
            },
            endHour: {
                type: DataTypes.INTEGER,
            },
            startDate: {
                type: DataTypes.DATE,


            },
            endDate: {
                type: DataTypes.DATE,


            },
        },
        {
            sequelize,
            modelName: "TeamEvent",
            tableName: "TeamEvents",
            timestamps: true,
            underscored: false,
        }
    );
    return TeamEvent;
};