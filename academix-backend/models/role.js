'use strict';
const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class Role extends Model {
    static associate(models) {
      Role.hasMany(models.RoleAssignment, {
        foreignKey: 'role_code',
        sourceKey: 'code'
      });
    }
  }

  Role.init(
    {
      code: {
        // STRING (as in the original migration) so RoleAssignments.role_code (STRING) can reference it.
        type: DataTypes.STRING,
        primaryKey: true,
        validate: {
          isIn: [[
            'DOMAIN_MANAGER',
            'COURSE_COMMANDER',
            'TEAM_COMMANDER',
            'STUDENT',
            'OVERLAP',
            'SYSTEM-ADMIN',
            'DEVELOPER'
          ]]
        }
      },
      name_he: {
        type: DataTypes.STRING,
        allowNull: false
      },
      name_en: {
        type: DataTypes.STRING,
        allowNull: false
      }
    },
    {
      sequelize,
      modelName: 'Role',
      tableName: 'Roles'
    }
  );

  return Role;
};