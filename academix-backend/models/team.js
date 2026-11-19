"use strict";
const { Model } = require("sequelize");

module.exports = (sequelize, DataTypes) => {
  class Team extends Model {
    static associate(models) {
   /*    Team.belongsTo(models.CourseBatch, {
        foreignKey: "course_batch_id",
         onDelete:"CASCADE",
        onUpdate:"CASCADE"
      });
 */

          Team.belongsTo(models.Course, {
        foreignKey: "courseId",
        as: "course",
        onDelete: "CASCADE",
        onUpdate: "CASCADE",
      });

      Team.hasMany(models.Axis, {
        foreignKey: "team_id",
      });

      Team.hasMany(models.TeamMember, {
        foreignKey: "team_id",
        as: "teamMembers",
      });
      Team.hasMany(models.Task, {
        foreignKey: "team_id",
        as: "tasks",
      });
      Team.hasMany(models.TaskGroup, {
        foreignKey: "team_id",
        as: "taskGroups",
      });


      Team.hasMany(models.TeamCourseBatch, {
  foreignKey: "team_id",
  as: "courseBatches",
});
      
    }
  }

  Team.init(
    {
      name: {
        type: DataTypes.STRING,
        allowNull: false,
      },
       courseId: {
        type: DataTypes.INTEGER,
        allowNull: true,
        references: {
          model: "Courses",
          key: "id",
        },
        onUpdate: "CASCADE",
        onDelete: "SET NULL",
      },
     /*  course_batch_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
      }, */
    },
    
    {
      sequelize,
      modelName: "Team",
      tableName: "Teams",

      timestamps: true,
    }
  );

  return Team;
};
