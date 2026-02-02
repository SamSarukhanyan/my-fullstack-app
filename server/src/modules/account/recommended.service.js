//recommended.service.js
import { USER_PUBLIC_FIELDS } from "#modules/auth/constants/user.attributes.js";
import { Op } from "sequelize";

/**
 * Recommended Users Service
 * Handles fetching recommended users for the authenticated user
 * 
 * This service is isolated and does not modify existing account logic.
 */
export class RecommendedService {
  constructor(User, Follow, sequelize) {
    this.User = User;
    this.Follow = Follow;
    this.sequelize = sequelize;
  }

  /**
   * Get recommended users
   * Returns the last registered users, excluding ONLY the current user
   * 
   * Follow relationships are NOT used for filtering - they are only used to compute followStatus.
   * This ensures users are always shown in recommendations, regardless of follow status.
   * 
   * @param {number} currentUserId - The authenticated user's ID
   * @param {number} limit - Maximum number of users to return (default: 20)
   * @returns {Promise<Array>} Array of recommended users with follow status
   */
  async getRecommendedUsers(currentUserId, limit = 20) {
    // Get recommended users (last registered = highest IDs, since timestamps are disabled)
    // ONLY exclude the authenticated user - do NOT filter by follow relationships
    const recommendedUsers = await this.User.findAll({
      where: {
        id: {
          [Op.ne]: currentUserId, // Exclude ONLY the authenticated user
        },
      },
      attributes: [...USER_PUBLIC_FIELDS, 'isPrivate'], // Include isPrivate for follow button logic
      order: [['id', 'DESC']], // Order by ID DESC (newest users first)
      limit: limit,
    });

    // Get follow status for each recommended user
    // This reuses existing follow logic to COMPUTE status, not to filter users
    const userIds = recommendedUsers.map(u => u.id);
    
    let followStatuses = {};
    if (userIds.length > 0) {
      const followRecords = await this.Follow.findAll({
        where: {
          followerId: currentUserId,
          followingId: {
            [Op.in]: userIds,
          },
        },
        attributes: ['followingId', 'status'],
      });

      // Map follow statuses by followingId
      followRecords.forEach(follow => {
        followStatuses[follow.followingId] = follow.status;
      });
    }

    // Transform users to include follow status
    // Normalize follow status to match frontend expectations: 'unfollowed', 'requested', 'followed'
    return recommendedUsers.map(user => {
      const plain = user.get({ plain: true });
      const rawStatus = followStatuses[plain.id];
      
      // Normalize status: backend uses 'requested', 'followed', 'unfollowed'
      // Frontend expects the same values
      let normalizedStatus = 'unfollowed';
      if (rawStatus === 'followed') {
        normalizedStatus = 'followed';
      } else if (rawStatus === 'requested') {
        normalizedStatus = 'requested';
      }
      
      return {
        id: plain.id,
        name: plain.name || '',
        surname: plain.surname || '',
        username: plain.username || '',
        picture_url: plain.picture_url || null,
        isPrivate: plain.isPrivate || false,
        followStatus: normalizedStatus,
      };
    });
  }
}

