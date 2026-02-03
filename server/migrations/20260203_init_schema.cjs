"use strict";

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    const existingRaw = await queryInterface.showAllTables();
    const existing = new Set(
      existingRaw.map((t) =>
        typeof t === "string" ? t.toLowerCase() : String(t.tableName).toLowerCase()
      )
    );

    const has = (name) => existing.has(name.toLowerCase());

    if (!has("users")) {
    await queryInterface.createTable("users", {
      id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true,
        allowNull: false,
      },
      name: { type: Sequelize.STRING, allowNull: true },
      surname: { type: Sequelize.STRING, allowNull: true },
      username: { type: Sequelize.STRING, allowNull: false, unique: true },
      password: { type: Sequelize.STRING, allowNull: false },
      isPrivate: {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: false,
      },
      picture_url: { type: Sequelize.STRING, allowNull: true },
    });
    }

    if (!has("followers")) {
    await queryInterface.createTable("followers", {
      id: { type: Sequelize.INTEGER, primaryKey: true, autoIncrement: true },
      followerId: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: { model: "users", key: "id" },
        onDelete: "CASCADE",
      },
      followingId: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: { model: "users", key: "id" },
        onDelete: "CASCADE",
      },
      status: {
        type: Sequelize.ENUM("requested", "followed", "unfollowed"),
        defaultValue: "unfollowed",
      },
    });

    await queryInterface.addIndex("followers", ["followerId", "followingId"], {
      unique: true,
      name: "followers_unique_pair",
    });
    }

    if (!has("posts")) {
    await queryInterface.createTable("posts", {
      id: { type: Sequelize.INTEGER, primaryKey: true, autoIncrement: true },
      userId: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: { model: "users", key: "id" },
        onDelete: "CASCADE",
        onUpdate: "CASCADE",
      },
      description: { type: Sequelize.STRING, allowNull: false },
      title: { type: Sequelize.STRING, allowNull: false },
    });

    await queryInterface.addIndex("posts", ["userId"], {
      name: "posts_user_id_idx",
    });
    }

    if (!has("post_images")) {
    await queryInterface.createTable("post_images", {
      id: { type: Sequelize.INTEGER, primaryKey: true, autoIncrement: true },
      postId: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: { model: "posts", key: "id" },
        onDelete: "CASCADE",
      },
      image_url: { type: Sequelize.STRING, allowNull: false },
    });
    }

    if (!has("likes")) {
    await queryInterface.createTable("likes", {
      id: { type: Sequelize.INTEGER, primaryKey: true, autoIncrement: true },
      userId: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: { model: "users", key: "id" },
        onDelete: "CASCADE",
        onUpdate: "CASCADE",
      },
      postId: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: { model: "posts", key: "id" },
      },
      status: { type: Sequelize.BOOLEAN, allowNull: true },
    });

    await queryInterface.addIndex("likes", ["userId"], {
      name: "likes_user_id_idx",
    });
    }

    if (!has("comments")) {
    await queryInterface.createTable("comments", {
      id: { type: Sequelize.INTEGER, primaryKey: true, autoIncrement: true },
      userId: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: { model: "users", key: "id" },
      },
      postId: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: { model: "posts", key: "id" },
      },
      text: { type: Sequelize.TEXT, allowNull: false },
    });

    await queryInterface.addIndex("comments", ["userId"], {
      name: "comments_user_id_idx",
    });
    }
  },

  async down(queryInterface) {
    await queryInterface.dropTable("comments");
    await queryInterface.dropTable("likes");
    await queryInterface.dropTable("post_images");
    await queryInterface.dropTable("posts");
    await queryInterface.removeIndex("followers", "followers_unique_pair");
    await queryInterface.dropTable("followers");
    await queryInterface.dropTable("users");
  },
};
