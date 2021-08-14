module.exports = (sequelize,DataTypes) => {
    const QuestionCategory = sequelize.define('QuestionCategory', {
      }, { timestamps: false,
        freezeTableName: true,
        modelName: 'singularName' });
    return QuestionCategory;
};