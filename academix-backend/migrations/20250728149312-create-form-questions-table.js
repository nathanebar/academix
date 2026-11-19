"use strict";
module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable("FormQuestions", {
      id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true,
        allowNull: false,
      },
      form_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: "Forms",
          key: "id",
        },
        onUpdate: "CASCADE",
        onDelete: "CASCADE",
      },
      question_text: {
        type: Sequelize.TEXT,
        allowNull: false,
      },
      question_type: {
        type: DataTypes.ENUM(
          "scale",
          "text",
          "description",
          "multipleQuestion", // ← anciennement "matching_pairs"
          "american",
          "fill_in_bank",
          "fill_in_open",
          "ordering_words",
          "ordering_line",
          "true_false",
          "matching_pairs", // ← anciennement "matrix_single"
          "file_upload"
        ),
        allowNull: false,
      },
      is_required: {
        type: Sequelize.BOOLEAN,
        defaultValue: false,
        allowNull: false,
      },
      points: {
        type: Sequelize.INTEGER,
        allowNull: true,
      },
      orderIndex: {
        type: Sequelize.INTEGER,
        allowNull: true,
      },

      createdAt: {
        allowNull: false,
        type: Sequelize.DATE,
        defaultValue: Sequelize.literal("NOW()"),
      },
      updatedAt: {
        allowNull: false,
        type: Sequelize.DATE,
        defaultValue: Sequelize.literal("NOW()"),
      },
    });
  },
  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable("FormQuestions");
  },
};
