'use strict';
module.exports = (sequelize, DataTypes) => {
var User = sequelize.define('User', {
    id: {
        allowNull: false,
        primaryKey: true,
        unique:true,
        type: DataTypes.UUID,
    },
    first_name: {
        type: DataTypes.STRING,
        allowNull: false
    },
    last_name: {
        type: DataTypes.STRING,
        allowNull: false
    },
    password: {
        allowNull: false,
        type: DataTypes.STRING 
    },
    username: {
        allowNull: false,
        unique:true,
        type: DataTypes.STRING
    },
    account_created: {
        allowNull: false,
        unique:true,
        type: DataTypes.STRING
    },
    account_updated: {
        allowNull: false,
        unique:true,
        type: DataTypes.STRING
    }
},{
    timestamps: false,
    freezeTableName: true,
    modelName: 'singularName'
}
);
User.associate = function(models) {
    User.hasMany(models.Question, {
      foreignKey: 'user_id',//,
    //   as: 'user'
    onDelete: 'CASCADE',
    onUpdate: 'CASCADE',
    });

    User.hasMany(models.Answer,{
        foreignKey:'user_id',
        as:'user_id',
        onDelete: 'CASCADE',
        onUpdate: 'CASCADE',
    });
  };

return User;
}

