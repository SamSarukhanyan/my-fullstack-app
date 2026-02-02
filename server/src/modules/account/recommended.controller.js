//recommended.controller.js

/**
 * Recommended Users Controller
 * Handles HTTP requests for recommended users
 * 
 * This controller is isolated and does not modify existing account controller logic.
 */
export class RecommendedController {
  constructor(service) {
    this.service = service;
  }

  /**
   * Get recommended users
   * GET /account/recommended?limit=20
   */
  async getRecommended(req, res) {
    const currentUserId = req.user.id;
    const limit = parseInt(req.query.limit, 10) || 20;
    
    // Validate limit (max 50 to prevent abuse)
    const safeLimit = Math.min(Math.max(1, limit), 50);

    const users = await this.service.getRecommendedUsers(currentUserId, safeLimit);
    
    return res.status(200).send({
      ok: true,
      payload: {
        users,
        count: users.length,
      },
    });
  }
}

