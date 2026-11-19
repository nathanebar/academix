const { Model, Sequelize, DataTypes } = require("sequelize");

module.exports = (sequelize, DataTypes) => {
  class AxisBatchArchives extends Model {
    static associate(models) {
      AxisBatchArchives.belongsTo(models.Axis, {
        foreignKey: "axis_id",
        // as: "axis",
      });

      AxisBatchArchives.belongsTo(models.CourseBatch, {
        foreignKey: "course_batch_id",
        as: "batch",
      });
    }
  }

  AxisBatchArchives.init(
    {
      axis_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
          model: "Axes",
          key: "id",
        },
      },
      course_batch_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
          model: "CourseBatch",
          key: "id",
        },
      },
      repository_kind: {
        type: DataTypes.ENUM("operational", "assignment_bank", "archives"),
        allowNull: false,
      },
    },
    {
      sequelize,
      timestamps: true,
      modelName: "AxisBatchArchives",
      tableName: "AxisBatchArchives",
      //   underscored: true,
    }
  );

  return AxisBatchArchives;
};
