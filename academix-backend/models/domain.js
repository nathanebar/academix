"use strict";
const { Model } = require("sequelize");

module.exports = (sequelize, DataTypes) => {
  class Domain extends Model {
    static associate(models) {
      // Domain belongs to System
      Domain.belongsTo(models.System, { foreignKey: "systemId" });

      // Domain has many Courses
     Domain.hasMany(models.Course, { 
  foreignKey: "domainId",
  onDelete: "CASCADE",
  constraints: true
});

      // Domain has many RoleAssignments
      Domain.hasMany(models.RoleAssignment, {
        as: "roleAssignments",
        foreignKey: "scope_id",
        constraints: false,
      });
    }
  }

  Domain.init(
    {
      name: {
        type: DataTypes.STRING,
        allowNull: false,
        // Unique through the named index in the options (see models/user.js for why).
      },
      systemId: {
        type: DataTypes.INTEGER,
        references: {
          model: "Systems",
          key: "id",
        },
      },
    },
    {
      sequelize,
      modelName: "Domain",
      indexes: [{ name: "Domains_name_key", unique: true, fields: ["name"] }],
    }
  );

  return Domain;
};