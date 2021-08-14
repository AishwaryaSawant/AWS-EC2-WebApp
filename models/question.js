'use strict';
module.exports = (sequelize, DataTypes) => {
var Question = sequelize.define('Question', {
    question_id: {
        allowNull: false,
        primaryKey: true,
        unique:true,
        type: DataTypes.UUID,
    },
    
    created_timestamp: {
        allowNull: false,
        // unique:true,
        type: DataTypes.STRING
    },
    updated_timestamp: {
        allowNull: false,
        // unique:true,
        type: DataTypes.STRING
    },
    user_id: {
        allowNull: false,
        // unique:true,
        type: DataTypes.UUID
    },
    question_text: {
        allowNull: false,
        type: DataTypes.STRING
    }
    // attachment:{
    //     type: DataTypes.JSON
    // }
},{
    timestamps: false,
    freezeTableName: true,
    modelName: 'singularName'
}
);
Question.associate = function(models) {
    // Question.hasOne(models.User, {
    //   foreignKey: 'user_id'//,
    // //   as: 'user'
    // });

    Question.hasMany(models.Answer, {
        foreignKey: 'question_id',//,
        // as: 'questions'
        onDelete: 'CASCADE',
        onUpdate: 'CASCADE'
      });

    Question.belongsToMany(models.Category, {
        through: 'QuestionCategory',
        // through: 'QuestionCategories',
        // as: 'questions',
        foreignKey: 'question_id',
        onDelete : 'cascade'
      });


    Question.hasMany(models.File, {
        foreignKey: 'question_id',//,
        //as: 'attachements',
        onDelete: 'CASCADE',
        onUpdate: 'CASCADE'
      });
  };

return Question;
}

