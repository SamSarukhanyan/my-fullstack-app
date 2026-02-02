// comment.model.js
export default function (sequelize, DataTypes) {
  const Comment = sequelize.define(
    "Comment",
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
      },
      postId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
          model: "posts",
          key: "id",
        },
      },
      text: {
        type: DataTypes.TEXT,
        allowNull: false,
      },
    },
    {
      tableName: "comments",
      timestamps: false,
      indexes: [
        {
          fields: ["userId"],
        },
      ],
    }
  );

  return Comment;
}
