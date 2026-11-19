"use strict";
const { DataTypes } = require("sequelize");

module.exports = (sequelize, DataTypes) => {
    const TaskVisibilityOverride = sequelize.define(
        "TaskVisibilityOverride",
        {
            id: {
                type: DataTypes.INTEGER,
                primaryKey: true,
                autoIncrement: true,
            },
            task_id: {
                type: DataTypes.INTEGER,
                allowNull: false,
                references: {
                    model: "Tasks",
                    key: "id",
                },
            },
            team_id: {
                type: DataTypes.INTEGER,
                allowNull: false,
                references: {
                    model: "Teams",
                    key: "id",
                },
            },
            start_minutes_before: {
                type: DataTypes.INTEGER,
                allowNull: false,
                defaultValue: 0,
                comment: "כמה דקות לפני שיבוץ המשימה היא תיפתח",
            },
            end_minutes_after: {
                type: DataTypes.INTEGER,
                allowNull: false,
                defaultValue: 0,
                comment: "כמה דקות אחרי שיבוץ המשימה היא תיסגר",
            },
            created_by: {
                type: DataTypes.INTEGER,
                references: {
                    model: "Users",
                    key: "id",
                },
            },
        },
        {
            tableName: "TaskVisibilityOverrides",
            timestamps: true,
            createdAt: "created_at",
            updatedAt: "updated_at",
        }
    );

    TaskVisibilityOverride.associate = function (models) {
        TaskVisibilityOverride.belongsTo(models.Task, {
            foreignKey: "task_id",
        });
        TaskVisibilityOverride.belongsTo(models.Team, {
            foreignKey: "team_id",
        });
        TaskVisibilityOverride.belongsTo(models.User, {
            as: "creator",
            foreignKey: "created_by",
        });
    };

    return TaskVisibilityOverride;
};