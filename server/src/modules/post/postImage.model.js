// postImage.model.js
export default function (sequelize, DataTypes) {
  const PostImage = sequelize.define(
    "PostImage",
    {
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },
      postId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
          model: "posts",
          key: "id",
        },
        onDelete: "CASCADE",
      },
      image_url: {
        type: DataTypes.STRING,
        allowNull: false,
      },
    },
    {
      tableName: "post_images",
      timestamps: false,
    }
  );

  return PostImage;
}
