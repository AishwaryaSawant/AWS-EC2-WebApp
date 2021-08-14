'use strict';
// const uuid = require('uuid/v4');
module.exports = (sequelize, DataTypes) => {
var File = sequelize.define("File", {
    file_id: {
      allowNull: false,
      primaryKey: true,
      unique:true,
      type: DataTypes.UUID,
    },
    file_name: {
      type: DataTypes.STRING,
      allowNull: false
    },
    s3_object_name: {
      type: DataTypes.STRING,
      allowNull: false
    },
    created_date: {
      allowNull: false,
      // unique:true,
      type: DataTypes.STRING
    },
    metaData:{
      allowNull: false,
      type: DataTypes.JSON
}
},{
  timestamps: false,
  defaultScope: {
    attributes: { exclude: ['metaData','question_id','answer_id'] }
},
  freezeTableName: true,
  modelName: 'singularName'
}
);
  return File;
};
  
