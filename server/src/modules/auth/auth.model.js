//auth.model.js
export default function (sequelize, DataTypes) {
  const User = sequelize.define(
    "User",
    {
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },
      name: DataTypes.STRING,
      surname: DataTypes.STRING,
      username: { type: DataTypes.STRING, unique: true },
      password: DataTypes.STRING,

      isPrivate: {
        type: DataTypes.BOOLEAN,
        defaultValue: false,
        allowNull: false,
      },
      picture_url: DataTypes.STRING,
    },
    {
      tableName: "users",
      timestamps: false,
      defaultScope: {
        attributes: { exclude: ["password"] },
      },
      scopes: {
        withPassword: {
          attributes: {},
        },
      },
    }
  );

  return User;
}
