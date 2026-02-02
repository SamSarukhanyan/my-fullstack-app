//account.service.js
import { USER_PUBLIC_FIELDS } from "#modules/auth/constants/user.attributes.js";
import { AppError } from "#utils/appError.js";
import { Op } from "sequelize";
import fs from "fs";
import path from "path";

export class AccountService {
  constructor(User, Follow, Post, sequelize) {
    this.User = User;
    this.Follow = Follow;
    this.Post = Post;
    this.sequelize = sequelize;
  }
  async searchByUserName(text) {
    const founds = await this.User.findAll({
      where: { name: { [Op.like]: `${text}%` } },
      attributes: USER_PUBLIC_FIELDS,
    });
    return founds || [];
  }
  async getAccountById(id, currentUserId) {
    const account = await this.User.findByPk(id);
    if (!account) throw new AppError("Account not founddd", 404);

    const followersCount = await this.Follow.count({
      where: {
        followingId: id,
        status: "followed",
      },
    });

    const followingsCount = await this.Follow.count({
      where: {
        followerId: id,
        status: "followed",
      },
    });

    const postsCount = await this.Post.count({
      where: {
        userId: id,
      },
    });

    // Get follow status between current user and target user
    let followStatus = "unfollowed";
    if (currentUserId && currentUserId !== id) {
      const follow = await this.Follow.findOne({
        where: {
          followerId: currentUserId,
          followingId: id,
        },
      });
      if (follow) {
        followStatus = follow.status;
      }
    }

    return {
      ...account.toJSON(),
      counts: {
        followers: followersCount,
        followings: followingsCount,
        posts: postsCount,
      },
      followStatus, // Include follow status
    };
  }
  async getFollowers(userId) {
    const user = await this.User.findByPk(userId, {
      attributes: ["id"],
      include: [
        {
          model: this.User,
          as: "Followers",
          attributes: USER_PUBLIC_FIELDS,
          through: {
            where: { status: "followed" },
            attributes: [],
          },
        },
      ],
    });

    if (!user) throw new AppError("User not found", 404);

    return user.Followers || [];
  }
  async getFollowings(userId) {
    const user = await this.User.findByPk(userId, {
      attributes: ["id"],
      include: [
        {
          model: this.User,
          as: "Followings",
          attributes: USER_PUBLIC_FIELDS,
          through: {
            where: { status: "followed" },
            attributes: [],
          },
        },
      ],
    });

    if (!user) throw new AppError("User not found", 404);

    return user.Followings;
  }
  async follow(curr, target) {
    return this.sequelize.transaction(async (transaction) => {
      if (curr == target) throw new AppError("bad request", 400);
      const targetUser = await this.User.findByPk(target);
      if (!targetUser) throw new AppError("User not found", 404);

      const [follow, created] = await this.Follow.findOrCreate({
        where: {
          followerId: curr,
          followingId: target,
        },
        defaults: {
          status: targetUser.isPrivate ? "requested" : "followed",
        },
        transaction,
      });
      
      if (!created) {
        // Handle state transitions:
        // - unfollowed → requested (private) or followed (public)
        // - requested → unfollowed (cancel request)
        // - followed → unfollowed (unfollow)
        if (follow.status === "unfollowed") {
          follow.status = targetUser.isPrivate ? "requested" : "followed";
        } else {
          // Both "requested" and "followed" transition to "unfollowed"
          follow.status = "unfollowed";
        }
      }
      
      await follow.save({ transaction });
      return {
        status: follow.status,
        targetUser: targetUser.toJSON(),
      };
    });
  }
  async getRequests(currUserid) {
    const requests = await this.Follow.findAll({
      where: {
        followingId: currUserid,
        status: "requested",
      },
      include: [
        {
          model: this.User,
          as: "sender",
          attributes: USER_PUBLIC_FIELDS,
        },
      ],
    });

    const plain = requests.map((r) => {
      const p = r.get({ plain: true });
      return {
        id: p.id, // Include Follow record ID for accept/decline
        sender: p.sender,
        followerId: p.followerId, // Include followerId for verification
        followingId: p.followingId, // Include followingId for verification
        status: p.status, // Include status for verification
      };
    });
    return plain;
  }
  async acceptFollow(currUserId, requestId) {
    // Convert requestId to integer if it's a string
    const followId = parseInt(requestId, 10);
    if (isNaN(followId)) {
      throw new AppError("Invalid request ID", 400);
    }

    const request = await this.Follow.findByPk(followId);
    if (!request) {
      throw new AppError("Request not found", 404);
    }

    // Verify the request belongs to the current user (they are the one being followed)
    if (request.followingId !== currUserId) {
      throw new AppError("Forbidden: You can only accept requests sent to you", 403);
    }

    // Verify the request is in "requested" state
    if (request.status !== "requested") {
      throw new AppError(`Invalid request state: expected "requested", got "${request.status}"`, 400);
    }

    // Update status to "followed"
    request.status = "followed";
    await request.save();

    return {
      status: request.status,
      followerId: request.followerId,
      followingId: request.followingId,
    };
  }
  async declineFollow(currUserId, requestId) {
    // Convert requestId to integer if it's a string
    const followId = parseInt(requestId, 10);
    if (isNaN(followId)) {
      throw new AppError("Invalid request ID", 400);
    }

    const request = await this.Follow.findByPk(followId);
    if (!request) {
      throw new AppError("Request not found", 404);
    }

    // Verify the request belongs to the current user (they are the one being followed)
    if (request.followingId !== currUserId) {
      throw new AppError("Forbidden: You can only decline requests sent to you", 403);
    }

    // Verify the request is in "requested" state
    if (request.status !== "requested") {
      throw new AppError(`Invalid request state: expected "requested", got "${request.status}"`, 400);
    }

    // Update status to "unfollowed" (declined)
    request.status = "unfollowed";
    await request.save();

    return {
      status: request.status,
      followerId: request.followerId,
      followingId: request.followingId,
    };
  }

  /**
   * Upload or replace user avatar (profile picture)
   * @param {number} userId - User ID
   * @param {string} filePath - Path to uploaded file (relative to uploads/avatars/)
   * @returns {Promise<User>} - Updated user object
   */
  async uploadAvatar(userId, filePath) {
    const user = await this.User.findByPk(userId);
    if (!user) throw new AppError("User not found", 404);

    // Delete old avatar if it exists
    if (user.picture_url) {
      // Handle both relative paths (uploads/avatars/filename.jpg) and absolute paths
      let oldFilePath = user.picture_url;
      if (!path.isAbsolute(oldFilePath)) {
        // Already relative, use as is
        oldFilePath = user.picture_url;
      } else {
        // Absolute path, extract relative part
        oldFilePath = path.relative(process.cwd(), oldFilePath);
      }
      
      try {
        if (fs.existsSync(oldFilePath)) {
          fs.unlinkSync(oldFilePath);
        }
      } catch (error) {
        // Log error but don't fail the upload
        console.error("Error deleting old avatar:", error);
      }
    }

    // Update user with new avatar path
    // Store relative path: "uploads/avatars/filename.jpg"
    user.picture_url = filePath;
    await user.save();

    const { password: _, ...safeUser } = user.toJSON();
    return safeUser;
  }

  /**
   * Delete user avatar (profile picture)
   * @param {number} userId - User ID
   * @returns {Promise<User>} - Updated user object
   */
  async deleteAvatar(userId) {
    const user = await this.User.findByPk(userId);
    if (!user) throw new AppError("User not found", 404);

    // Delete avatar file if it exists
    if (user.picture_url) {
      // Handle both relative paths (uploads/avatars/filename.jpg) and absolute paths
      let filePath = user.picture_url;
      if (!path.isAbsolute(filePath)) {
        // Already relative, use as is
        filePath = user.picture_url;
      } else {
        // Absolute path, extract relative part
        filePath = path.relative(process.cwd(), filePath);
      }
      
      try {
        if (fs.existsSync(filePath)) {
          fs.unlinkSync(filePath);
        }
      } catch (error) {
        // Log error but don't fail the deletion
        console.error("Error deleting avatar file:", error);
      }
    }

    // Clear avatar path in database
    user.picture_url = null;
    await user.save();

    const { password: _, ...safeUser } = user.toJSON();
    return safeUser;
  }
}
