import { AppError } from "#utils/appError.js";

export class CommentService {
  constructor(Comment, Post, sequelize) {
    this.Comment = Comment;
    this.Post = Post;
    this.sequelize = sequelize;
  }
  async addComment(currUserId, postId, body) {
    return this.sequelize.transaction(async (transaction) => {
      const post = await this.Post.findByPk(postId);
      if (!post) throw new AppError("Post not found", 404);

      const comment = await this.Comment.create(
        {
          userId: currUserId,
          postId: postId,
          text: body.comment,
        },
        { transaction }
      );
      
      // Fetch comment with user data
      const User = this.sequelize.models.User;
      const commentWithUser = await this.Comment.findByPk(comment.id, {
        include: [
          {
            model: User,
            as: "User", // Must match the alias in Comment.belongsTo(User, { as: "User" })
            attributes: ["id", "name", "surname", "username", "picture_url"],
          },
        ],
        transaction,
      });
      
      const plain = commentWithUser.get({ plain: true });
      const user = plain.User || {};
      
      return {
        id: plain.id,
        text: plain.text,
        userId: plain.userId,
        postId: plain.postId,
        author: {
          id: user.id || plain.userId,
          name: user.name || '',
          surname: user.surname || '',
          username: user.username || '',
          picture_url: user.picture_url || null,
        },
      };
    });
  }
}
