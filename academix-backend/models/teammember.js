// models/TeamMember.js
"use strict";
const { Model } = require("sequelize");

module.exports = (sequelize, DataTypes) => {
  class TeamMember extends Model {
    static associate(models) {
      TeamMember.belongsTo(models.User, {
        foreignKey: "user_id",
        onDelete: "CASCADE",
      });

      TeamMember.belongsTo(models.Team, {
        foreignKey: "team_id",
        onDelete: "CASCADE",
        onUpdate: "CASCADE",
      });

      // ✅ קישור ישיר למחזור
      TeamMember.belongsTo(models.CourseBatch, {
        foreignKey: "course_batch_id",
        as: "courseBatch",
        onDelete: "CASCADE",
        onUpdate: "CASCADE",
      });
       TeamMember.hasMany(models.FeedbackAnswer, {
        as: "feedbackAnswers",
        foreignKey: "team_member_id",
        constraints: false,
      });
      TeamMember.hasMany(models.TaskAssignment, {
        foreignKey: "user_id",
      });

       TeamMember.hasMany(models.TaskAssignmentHofef, {
        foreignKey: "team_member_id",
        as: "expectedTaskHofefs",
      });
       TeamMember.hasMany(models.NoteBookFolder, {
        foreignKey: "team_member_id",
        as: "NoteBookFolder",
      });
      
    }
  }

  TeamMember.init(
    {
      team_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
          model: "Teams",
          key: "id",
        },
        onUpdate: "CASCADE",
        onDelete: "CASCADE",
      },
      user_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
          model: "Users",
          key: "id",
        },
        onUpdate: "CASCADE",
        onDelete: "CASCADE",
      },
      course_batch_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
          model: "CourseBatches",
          key: "id",
        },
        onUpdate: "CASCADE",
        onDelete: "CASCADE",
      },
      member_role: {
        type: DataTypes.ENUM("STUDENT", "TEAM_COMMANDER", "OVERLAP"),
        allowNull: false,
      },
      delete_reason: {
        type: DataTypes.ENUM(
          "Professionally",
          "LowGrades",
          "PersonalCompulsions",
          "PlacementError"
        ),
      },
    },
    {
      sequelize,
      modelName: "TeamMember",
      tableName: "TeamMembers",
      timestamps: true,
      indexes: [
        { name: "team_members_user_id_idx", fields: ["user_id"] },
        { name: "team_members_team_id_member_role_idx", fields: ["team_id", "member_role"] },
        { name: "team_members_course_batch_id_idx", fields: ["course_batch_id"] },
      ],
    }
  );

  return TeamMember;
};