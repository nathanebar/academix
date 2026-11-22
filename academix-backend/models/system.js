"use strict";
const { Model } = require("sequelize");

module.exports = (sequelize, DataTypes) => {
  class System extends Model {
    static associate(models) {
      System.hasMany(models.Domain, { foreignKey: "systemId" });
    }
  }

  System.init(
    {
      name: {
        type: DataTypes.STRING,
        allowNull: false,
        // Unique through the named index below (see models/user.js for why).
      },
    },
    {
      indexes: [{ name: "Systems_name_key", unique: true, fields: ["name"] }],
      sequelize,
      modelName: "System",
    }
  );

  return System;
};