export class AccountController {
  constructor(service) {
    this.service = service;
  }

  async search(req, res) {
    const users = await this.service.searchByUserName(req.params.text);
    return res.status(200).send({ ok: true, payload: { users } });
  }
  async getById(req, res) {
    const account = await this.service.getAccountById(req.params.id, req.user.id);
    res.status(200).send({ ok: true, payload: { account } });
  }
  async getFollowers(req, res) {
    // Support both current user and specific user ID
    const userId = req.params.userId ? parseInt(req.params.userId) : req.user.id;
    const users = await this.service.getFollowers(userId);
    res.status(200).send({ ok: true, payload: { users } });
  }
  async getFollowings(req, res) {
    // Support both current user and specific user ID
    const userId = req.params.userId ? parseInt(req.params.userId) : req.user.id;
    const users = await this.service.getFollowings(userId);
    res.status(200).send({ ok: true, payload: { users } });
  }
  async follow(req, res) {
    const currentUserId = req.user.id;
    const targetUserId = +req.params.id;

    const { status, targetUser } = await this.service.follow(
      currentUserId,
      targetUserId
    );
    res.status(200).send({ ok: true, payload: { status, targetUser } });
  }
  async requests(req, res) {
    const requests = await this.service.getRequests(req.user.id);
    res.status(200).send({ ok: true, users: requests });
  }
  async acceptFollow(req, res) {
    const currUserId = req.user.id;
    const requestId = req.params.id;
    const result = await this.service.acceptFollow(currUserId, requestId);
    res.status(200).send({ ok: true, payload: result });
  }
  async declineFollow(req, res) {
    const currUserId = req.user.id;
    const requestId = req.params.id;
    const result = await this.service.declineFollow(currUserId, requestId);
    res.status(200).send({ ok: true, payload: result });
  }
  async uploadAvatar(req, res) {
    const userId = req.user.id;

    // Check if file was uploaded
    if (!req.file) {
      return res.status(400).send({ 
        ok: false, 
        message: "No file uploaded. Please select an image file." 
      });
    }

    // File path relative to project root: "uploads/avatars/filename.jpg"
    // req.file.path is already the full path, but we want to store it as relative
    // Multer saves to "uploads/avatars/filename.jpg" (relative to project root)
    const filePath = req.file.path;

    const updatedUser = await this.service.uploadAvatar(userId, filePath);
    res.status(200).send({ ok: true, payload: updatedUser });
  }
  async deleteAvatar(req, res) {
    const userId = req.user.id;

    const updatedUser = await this.service.deleteAvatar(userId);
    res.status(200).send({ ok: true, payload: updatedUser });
  }
}
