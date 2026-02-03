import { AppError } from "#utils/appError.js";
import { Op } from "sequelize";
import fs from "fs/promises";

//post.service.js
export class PostService {
  constructor(
    sequelize,
    postModel,
    userModel,
    PostImage,
    likeModel,
    CommentService,
    followModel
  ) {
    this.sequelize = sequelize;
    this.Post = postModel;
    this.User = userModel;
    this.PostImage = PostImage;
    this.Like = likeModel;
    this.Comment = CommentService;
    this.Follow = followModel;
  }

  async getPosts(userId, currUserId = null) {
    const targetUser = await this.User.findByPk(userId, {
      attributes: ["id", "isPrivate"],
    });
    if (!targetUser) throw new AppError("User not found", 404);

    if (targetUser.isPrivate && currUserId && userId !== currUserId) {
      const follow = await this.Follow.findOne({
        where: {
          followerId: currUserId,
          followingId: userId,
          status: "followed",
        },
      });
      if (!follow) throw new AppError("You cannot view this user's posts", 403);
    }

    const posts = await this.Post.findAll({
      where: { userId },
      include: [
        {
          model: this.PostImage,
          as: "images",
          attributes: ["image_url"],
        },
        {
          model: this.User,
          as: "author",
          attributes: ["id", "name", "surname", "username", "picture_url"],
        },
        {
          model: this.Like,
          as: "postLikes",
          where: { status: true },
          required: false,
          attributes: ["id", "userId", "postId"],
        },
        {
          model: this.Comment,
          as: "comments",
          required: false,
          attributes: ["id"],
        },
      ],
      attributes: ["id", "description", "title"], // Include id for frontend
      order: [["id", "DESC"]],
    });
    
    // Transform posts to include liked status and counts
    return posts.map((post) => {
      const plain = post.get({ plain: true });
      const likes = plain.postLikes || [];
      const comments = plain.comments || [];
      
      // Check if current user liked this post
      const liked = currUserId 
        ? likes.some((like) => like && like.userId === currUserId)
        : false;
      
      return {
        id: plain.id,
        title: plain.title || '',
        description: plain.description || '',
        images: plain.images || [],
        author: plain.author || {},
        liked: liked || false,
        likesCount: likes.length,
        commentsCount: comments.length,
      };
    });
  }
  async createPost(userId, body, files) {
    const uploadedPaths = files?.map((f) => f.path) ?? [];

    try {
      return await this.sequelize.transaction(async (transaction) => {
        const post = await this.Post.create(
          { title: body.title, description: body.description, userId },
          { transaction }
        );

        if (files?.length) {
          const photos = files.map((f) => ({
            postId: post.id,
            image_url: f.path,
          }));
          await this.PostImage.bulkCreate(photos, { transaction });
        }

        return post.get({ plain: true });
      });
    } catch (err) {
      await this.cleanupFiles(uploadedPaths);
      throw err;
    }
  }
  async cleanupFiles(paths) {
    for (const path of paths) {
      try {
        await fs.unlink(path);
      } catch (err) {
        console.error("[CLEANUP_FAILED]", { path, error: err.message });
      }
    }
  }
  async getPostById(currUserId, postId) {
    try {
      const post = await this.Post.findByPk(postId, {
        attributes: ["id", "description", "title"],
        include: [
          {
            model: this.User,
            as: "author",
            attributes: ["id", "name", "surname", "username", "picture_url", "isPrivate"],
            required: true,
          },
          {
            model: this.PostImage,
            as: "images",
            required: false,
            attributes: ["image_url"],
          },
          {
            model: this.Comment,
            as: "comments",
            required: false,
            include: [
              {
                model: this.User,
                as: "User", // Must match the alias in Comment.belongsTo(User, { as: "User" })
                attributes: ["id", "name", "surname", "username", "picture_url"],
                required: false,
              },
            ],
          },
          {
            model: this.Like,
            as: "postLikes",
            where: { status: true },
            required: false,
            include: [
              {
                model: this.User,
                as: "likeAuthor",
                attributes: ["id", "name", "username"],
                required: false,
              },
            ],
          },
        ],
      });

      if (!post) throw new AppError("Post not found", 404);

      const plain = post.get({ plain: true });
      const author = plain.author;

      if (!author) {
        throw new AppError("Post author not found", 404);
      }

      if (author.id !== currUserId && author.isPrivate) {
        const follow = await this.Follow.findOne({
          where: {
            followerId: currUserId,
            followingId: author.id,
            status: "followed",
          },
        });

        if (!follow) {
          throw new AppError("You cannot view this post", 403);
        }
      }

      const likedUsers = (plain.postLikes || []).map((l) => l.likeAuthor || l).filter(Boolean);
      
      // Check if current user liked this post
      const liked = likedUsers.some((user) => user && user.id === currUserId);

      // Transform comments to include author info
      // Sort comments by ID descending (newest first) and handle missing data
      const commentsArray = plain.comments || [];
      const transformedComments = commentsArray
        .map((comment) => {
          if (!comment) return null;
          const commentUser = comment.User || {};
          return {
            id: comment.id,
            text: comment.text,
            userId: comment.userId,
            postId: comment.postId,
            author: {
              id: commentUser.id || comment.userId,
              name: commentUser.name || '',
              surname: commentUser.surname || '',
              username: commentUser.username || '',
              picture_url: commentUser.picture_url || null,
            },
          };
        })
        .filter(Boolean)
        .sort((a, b) => (b.id || 0) - (a.id || 0)); // Sort by ID descending

      return {
        id: plain.id,
        description: plain.description || '',
        title: plain.title || '',
        images: (plain.images || []).map((i) => ({ 
          image_url: i?.image_url || i?.imageUrl || '' 
        })),
        author: {
          id: author?.id,
          name: author?.name || '',
          surname: author?.surname || '',
          username: author?.username || '',
          picture_url: author?.picture_url || null,
        },
        liked: liked || false,
        likesCount: likedUsers.length,
        commentsCount: transformedComments.length,
        comments: transformedComments,
      };
    } catch (error) {
      // Log the error for debugging
      console.error('Error in getPostById:', error);
      console.error('Error stack:', error.stack);
      throw error;
    }
  }

  async likePost(currUserId, postId) {
    return this.sequelize.transaction(async (transaction) => {
      const [like, created] = await this.Like.findOrCreate({
        where: { userId: currUserId, postId: postId },
        defaults: { status: true },
        transaction,
      });
      if (!created) {
        like.status = !like.status;
        await like.save({ transaction });
      }

      // Get updated likes count
      const likesCount = await this.Like.count({
        where: { postId: postId, status: true },
        transaction,
      });

      return {
        liked: like.status,
        likesCount: likesCount,
        message: like.status ? "Post liked" : "Post unliked",
      };
    });
  }
}
