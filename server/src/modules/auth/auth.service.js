import { AppError } from "#utils/appError.js";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";

export class AuthService {
  constructor(userModel, Post, sequelize) {
    this.userModel = userModel;
    this.postmodel = Post;
    this.sequelize = sequelize;
  }

  async findByUsername(username) {
    return this.userModel
      .scope("withPassword")
      .findOne({ where: { username } });
  }
  async getUserById(id) {
    const user = await this.userModel.scope("withPassword").findByPk(id);
    if (!user) throw new AppError("User not found", 404);
    return user;
  }
  async createUser(user) {
    return this.sequelize.transaction(async (transaction) => {
      const createdUser = await this.userModel.create(user, { transaction });
      const { password: _, ...safeUser } = createdUser.toJSON();
      return safeUser;
    });
  }
  async generateToken(user, password) {
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) throw new AppError("Invalid password", 400);

    return jwt.sign({ id: user.id }, process.env.JWT_SECRET, {
      expiresIn: "20d",
    });
  }
  async updateUsername(userId, newUserName, password) {
    const user = await this.userModel.scope("withPassword").findByPk(userId);
    if (!user) throw new AppError("User not found", 404);

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) throw new AppError("Password incorrect", 400);

    const exist = await this.userModel.findOne({
      where: { username: newUserName },
    });
    if (exist) throw new AppError("Username taken", 400);

    user.username = newUserName;
    await user.save();

    const { password: _, ...safeUser } = user.toJSON();
    return safeUser;
  }
  async updatePrivacy(id, isPrivate) {
    const user = await this.userModel.findByPk(id);
    if (!user) throw new AppError("User not found", 404);

    user.isPrivate = isPrivate;
    await user.save();
    return user.isPrivate;
  }
}
