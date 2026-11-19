'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
    async up(queryInterface, Sequelize) {
        await queryInterface.createTable('TaskVisibilityOverrides', {
            id: {
                allowNull: false,
                autoIncrement: true,
                primaryKey: true,
                type: Sequelize.INTEGER
            },
            task_id: {
                type: Sequelize.INTEGER,
                allowNull: false,
                references: {
                    model: 'Tasks',
                    key: 'id'
                },
                onDelete: 'CASCADE'
            },
            team_id: {
                type: Sequelize.INTEGER,
                allowNull: false,
                references: {
                    model: 'Teams',
                    key: 'id'
                },
                onDelete: 'CASCADE'
            },
            start_minutes_before: {
                type: Sequelize.INTEGER,
                allowNull: false,
                defaultValue: 0,
                comment: 'כמה דקות לפני שיבוץ המשימה היא תיפתח'
            },
            end_minutes_after: {
                type: Sequelize.INTEGER,
                allowNull: false,
                defaultValue: 0,
                comment: 'כמה דקות אחרי שיבוץ המשימה היא תיסגר'
            },
            created_by: {
                type: Sequelize.INTEGER,
                references: {
                    model: 'Users',
                    key: 'id'
                }
            },
            created_at: {
                allowNull: false,
                type: Sequelize.DATE,
                defaultValue: Sequelize.literal('NOW()')
            },
            updated_at: {
                allowNull: false,
                type: Sequelize.DATE,
                defaultValue: Sequelize.literal('NOW()')
            }
        });

        await queryInterface.addIndex('TaskVisibilityOverrides', {
            fields: ['task_id', 'team_id'],
            unique: true,
            name: 'idx_visibility_overrides_unique'
        });

        await queryInterface.addIndex('TaskVisibilityOverrides', {
            fields: ['task_id', 'team_id'],
            name: 'idx_visibility_overrides_lookup'
        });
    },

    async down(queryInterface, Sequelize) {
        await queryInterface.dropTable('TaskVisibilityOverrides');
    }
};