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
        unique: true,
      },
    },
    {
      sequelize,
      modelName: "System",
    }
  );

  return System;
};