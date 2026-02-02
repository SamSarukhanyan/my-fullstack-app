export async function resetPosts(sequelize, Post, PostImage, Like) {
  await sequelize.transaction(async (t) => {
    await sequelize.query("SET FOREIGN_KEY_CHECKS = 0", { transaction: t });

    // await PostImage.destroy({
    //   where: {},
    //   truncate: true,
    //   transaction: t,
    // });
    await Like.destroy({
      where: {},
      truncate: true,
      transaction: t,
    });

    // await Post.destroy({
    //   where: {},
    //   truncate: true,
    //   restartIdentity: true,
    //   transaction: t,
    // });

    await sequelize.query("SET FOREIGN_KEY_CHECKS = 1", { transaction: t });
  });
}
