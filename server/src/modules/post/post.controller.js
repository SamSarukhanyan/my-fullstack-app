//post.controller.js
export class PostController {
  constructor(service) {
    this.service = service;
  }

  async getPosts(req, res) {
    // Support both current user and specific user ID
    const userId = req.query.userId ? parseInt(req.query.userId) : req.user.id;
    const currUserId = req.user.id; // Current authenticated user for liked status
    const posts = await this.service.getPosts(userId, currUserId);

    return res.status(200).json({
      ok: true,
      data: posts,
    });
  }
  async createPost(req, res) {
    const post = await this.service.createPost(
      req.user.id,
      req.body,
      req.files
    );
    return res.status(201).json({ ok: true, data: post });
  }
  async getPostById(req, res) {
    const post = await this.service.getPostById(req.user.id, req.params.id);
    res.status(200).json({ ok: true, data: post });
  }
  async likePost(req, res) {
    const currUserId = req.user.id;
    const postId = +req.params.id;
    const status = await this.service.likePost(currUserId, postId);
    res.status(201).json({ ok: true, data: status });
  }
  async addComment(req, res) {
    const currUserId = req.user.id;
    const postId = +req.params.id;
    const text = req.body;
    await this.CommentService.createComment(currUserId, postId, text);
  }
}
