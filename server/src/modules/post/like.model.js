// like.model.js
export default function (sequelize, DataTypes) {
  const Like = sequelize.define(
    "Like",
    {
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },
      userId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
          model: "users",
          key: "id",
        },
        onDelete: "CASCADE",
        onUpdate: "CASCADE",
      },
      postId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
          model: "posts",
          key: "id",
        },
      },
      status: {
        type: DataTypes.BOOLEAN,
      },
    },
    {
      tableName: "likes",
      timestamps: false,
      indexes: [
        {
          fields: ["userId"],
        },
      ],
    }
  );

  return Like;
}
