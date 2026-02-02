//follow.model.js

export default function (sequelize, DataTypes) {
  const Follow = sequelize.define(
    "Follow",
    {
      id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
      followerId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
          model: "users",
          key: "id",
        },
        onDelete: "CASCADE",
      },
      followingId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
          model: "users",
          key: "id",
        },
        onDelete: "CASCADE",
      },
      status: {
        type: DataTypes.ENUM("requested", "followed", "unfollowed"),
        defaultValue: "unfollowed",
      },
    },
    {
      tableName: "followers",
      timestamps: false,
      indexes: [
        {
          unique: true,
          fields: ["followerId", "followingId"],
        },
      ],
    }
  );

  return Follow;
}
