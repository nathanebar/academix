// models/TeamEventDay.js
"use strict";
const { Model } = require("sequelize");
module.exports = (sequelize, DataTypes) => {
    class TeamEventDay extends Model {
        static associate(models) {
            // יש להשאיר רק את הbelongsTo - ללא hasMany כאן
        }
    }
    TeamEventDay.init(
        {
            id: {
                type: DataTypes.INTEGER,
                autoIncrement: true,
                primaryKey: true,
                allowNull: false,
            },
            teamEventId: {
                type: DataTypes.INTEGER,
                allowNull: false,
                field: "team_event_id",
                references: {
                    model: "TeamEvents",
                    key: "id",
                },
                onUpdate: "CASCADE",
                onDelete: "CASCADE",
            },
            dayNum: {
                type: DataTypes.INTEGER,
                allowNull: false,
                validate: {
                    min: 0,
                    max: 7,
                },
                field: "day_num",
            },
        },
        {
            sequelize,
            modelName: "TeamEventDay",
            tableName: "TeamEventDays",
            timestamps: true,
            underscored: true,
        }
    );
    return TeamEventDay;
};