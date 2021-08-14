'use strict';
module.exports = (sequelize, DataTypes) => {
var Answer = sequelize.define('Answer', {
    answer_id: {
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
        type: DataTypes.UUID
    },
    answer_text: {
        allowNull: false,
        type: DataTypes.STRING
    }
},{
    timestamps: false,
    freezeTableName: true,
    modelName: 'singularName'
}
);
Answer.associate = function(models) {
    Answer.hasMany(models.File, {
        foreignKey: 'answer_id',//,
        //as: 'attachements',
        onDelete: 'CASCADE',
        onUpdate: 'CASCADE'
    });
}
// Answer.associate = function(models) {
//     // Answer.hasOne(models.User, {
//     //   foreignKey: 'user_id',
//     //   as: 'user'
//     // });

//     // Answer.belongsTo(models.Question, {
//     //     foreignKey: 'question_id',
//     //     as:'question_id'
//     //   });


//     // Answer.hasOne(models.Question, {
//     //   foreignKey: 'question_id',
//     //   as: 'question'
//     // });
//   };
return Answer;
}

