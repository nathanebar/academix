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
          model: "CourseBatches",
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
      // Not unique on purpose: existing production data may contain duplicates.
      indexes: [
        { name: "axis_batch_archives_axis_id_course_batch_id_idx", fields: ["axis_id", "course_batch_id"] },
      ],
      //   underscored: true,
    }
  );

  return AxisBatchArchives;
};
