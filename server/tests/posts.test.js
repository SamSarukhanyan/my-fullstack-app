import { describe, it, expect, beforeAll, beforeEach, afterAll } from "vitest";
import request from "supertest";
import app from "../src/app.js";
import db from "#db/index.js";
import { resetDb } from "./helpers/db.js";

async function signupAndLogin(username, password = "secret123") {
  await request(app).post("/api/auth/signup").send({
    username,
    password,
    name: "Test",
    surname: "User",
  });

  const loginRes = await request(app).post("/api/auth/login").send({
    username,
    password,
  });

  return loginRes.body.payload;
}

describe("Posts API", () => {
  beforeAll(async () => {
    await db.sequelize.authenticate();
  });

  beforeEach(async () => {
    await resetDb(db.sequelize);
  });

  afterAll(async () => {
    await db.sequelize.close();
  });

  it("GET /api/posts returns current user's posts", async () => {
    const token = await signupAndLogin("posts_user");
    const user = await db.User.findOne({ where: { username: "posts_user" } });

    await db.Post.create({
      userId: user.id,
      title: "Post 1",
      description: "Hello world",
    });

    const res = await request(app)
      .get("/api/posts")
      .set("Authorization", `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.ok).toBe(true);
    expect(res.body.data.length).toBe(1);
    expect(res.body.data[0].title).toBe("Post 1");
  });

  it("GET /api/posts blocks private user posts for non-followers", async () => {
    await signupAndLogin("private_user");
    const privateUser = await db.User.findOne({
      where: { username: "private_user" },
    });
    privateUser.isPrivate = true;
    await privateUser.save();

    await db.Post.create({
      userId: privateUser.id,
      title: "Private post",
      description: "Hidden",
    });

    const token = await signupAndLogin("viewer_user");
    const res = await request(app)
      .get(`/api/posts?userId=${privateUser.id}`)
      .set("Authorization", `Bearer ${token}`);

    expect(res.status).toBe(403);
  });

  it("GET /api/posts allows private user posts for followers", async () => {
    await signupAndLogin("private_user_followed");
    const privateUser = await db.User.findOne({
      where: { username: "private_user_followed" },
    });
    privateUser.isPrivate = true;
    await privateUser.save();

    await db.Post.create({
      userId: privateUser.id,
      title: "Private post",
      description: "Visible to follower",
    });

    const token = await signupAndLogin("viewer_follower");
    const viewer = await db.User.findOne({
      where: { username: "viewer_follower" },
    });

    await db.Follow.create({
      followerId: viewer.id,
      followingId: privateUser.id,
      status: "followed",
    });

    const res = await request(app)
      .get(`/api/posts?userId=${privateUser.id}`)
      .set("Authorization", `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.data.length).toBe(1);
  });
});
