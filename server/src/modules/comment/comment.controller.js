export class CommentController {
  constructor(service) {
    this.service = service;
  }
  async addComment(req, res) {
    const comment = await this.service.addComment(
      req.user.id,
      +req.params.id,
      req.body
    );
    res.status(201).json({ ok: true, data: comment });
  }
}
