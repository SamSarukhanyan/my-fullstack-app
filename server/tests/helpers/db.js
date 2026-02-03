export async function resetDb(sequelize) {
  await sequelize.query("SET FOREIGN_KEY_CHECKS = 0");
  const tables = [
    "comments",
    "likes",
    "post_images",
    "posts",
    "followers",
    "users",
  ];

  for (const table of tables) {
    await sequelize.query(`TRUNCATE TABLE ${table}`);
  }

  await sequelize.query("SET FOREIGN_KEY_CHECKS = 1");
}
