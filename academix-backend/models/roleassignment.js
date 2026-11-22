'use strict';
const { Model } = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class RoleAssignment extends Model {
    static associate(models) {
      RoleAssignment.belongsTo(models.User, {
        foreignKey: "user_id",
        onDelete: 'CASCADE'
      });
      RoleAssignment.belongsTo(models.Role, {
        foreignKey: "role_code",
        targetKey: "code",
        onDelete: 'CASCADE'
      });
      
      RoleAssignment.belongsTo(models.Domain, {
        as: "domain",
        foreignKey: "scope_id",
        constraints: false,
      });
      RoleAssignment.belongsTo(models.Course, {
        as: "course",
        foreignKey: "scope_id",
        constraints: false,
      });
      
      RoleAssignment.belongsTo(models.CourseBatch, {
        as: "batch",
        foreignKey: "scope_id",
        constraints: false,
      });
      RoleAssignment.belongsTo(models.Team, {
        as: "team",
        foreignKey: "scope_id",
        constraints: false,
      });
      RoleAssignment.belongsTo(models.TeamMember, {
        as: "teamMember",
        foreignKey: "scope_id",
        constraints: false,
      });
    }
  }
  
  RoleAssignment.init(
    {
      user_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        field: "user_id",
      },
      role_code: {
        type: DataTypes.STRING,
        allowNull: false,
        field: "role_code",
        validate: {
          isIn: [
            [
              "SYSTEM-ADMIN",
              "DOMAIN_MANAGER",
              "COURSE_COMMANDER",
              "TEAM_COMMANDER",
              "OVERLAP",
              "STUDENT",
            ],
          ],
        },
      },
      scope_type: {
        type: DataTypes.ENUM("system", "domain", "course", "team", "admin"),
        allowNull: false,
        field: "scope_type",
      },
      scope_id: {
        type: DataTypes.INTEGER,
        allowNull: true,
        field: "scope_id",
      },
    },
    {
      sequelize,
      modelName: "RoleAssignment",
      tableName: "RoleAssignments",
      indexes: [
        { name: "role_assignments_user_id_idx", fields: ["user_id"] },
        { name: "role_assignments_role_code_scope_id_idx", fields: ["role_code", "scope_id"] },
        { name: "role_assignments_scope_type_scope_id_idx", fields: ["scope_type", "scope_id"] },
      ],
    }
  );
  
  return RoleAssignment;
};