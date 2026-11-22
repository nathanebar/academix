"use strict";
const { Model } = require("sequelize");

module.exports = (sequelize, DataTypes) => {
  class User extends Model {
    static associate(models) {
      User.hasMany(models.Task, { foreignKey: 'creatorId' });
      // User.hasMany(models.TaskAssignment, { foreignKey: 'user_id' });
      User.hasMany(models.TeamMember, { foreignKey: 'user_id',onDelete:'CASCADE' });
      User.hasMany(models.RoleAssignment, { foreignKey: 'user_id',onDelete:'CASCADE' });
      User.hasMany(models.NoteBookFolder, { foreignKey: 'created_by',onDelete:'CASCADE' });
      User.hasMany(models.NoteBookNote, { foreignKey: 'created_by',onDelete:'CASCADE' });
    }
  }

  User.init(
    {
      name: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      militaryid: {
        type: DataTypes.STRING,
        allowNull: false,
        validate: {
          is: {
            args: /^\d{7}$/,
            msg: "Military ID must be exactly 7 numeric characters",
          },
        },
      },
      basicCourse: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      username: {
        type: DataTypes.STRING,
        allowNull: false,
        // Unique through the named index below, not `unique: true`: with `unique: true`,
        // every `db:init -- --alter` adds one more duplicate UNIQUE constraint.
      },
      password: {
        type: DataTypes.STRING,
        allowNull: true,
      },
    },
    {
      sequelize,
      modelName: "User",
      indexes: [
        // Same name as the constraint PostgreSQL created for the former `unique: true`,
        // so existing databases already have it and nothing is recreated.
        { name: "Users_username_key", unique: true, fields: ["username"] },
        { name: "users_militaryid_idx", fields: ["militaryid"] },
      ],
      // Ne jamais renvoyer le hash du mot de passe dans les réponses API
      defaultScope: { attributes: { exclude: ["password"] } },
      scopes: { withPassword: { attributes: { include: ["password"] } } },
    }
  );

  return User;
};
