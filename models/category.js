'use strict';
module.exports = (sequelize, DataTypes) => {
var Category = sequelize.define('Category', {
    category_id: {
        allowNull: false,
        primaryKey: true,
        unique:true,
        type: DataTypes.UUID,
    },
    category: {
        type: DataTypes.STRING,
        allowNull: false
    }
},{
    timestamps: false,
    freezeTableName: true,
    modelName: 'singularName'
}
);

Category.associate = function(models) {
    Category.belongsToMany(models.Question, {
        through: 'QuestionCategory',
        // through: 'QuestionCategories',
        // as: 'categories',
        foreignKey: 'category_id',
        onDelete : 'cascade'
      });
  };
return Category;
}