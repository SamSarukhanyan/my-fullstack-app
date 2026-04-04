/**
 * API endpoints — matches server config/routes.js (all under /api).
 * Use with apiFetch / apiFetchWithAuth from client.js.
 */

const AUTH = {
  signup: 'auth/signup',
  login: 'auth/login',
  user: 'auth/user',
  userUsername: 'auth/user/username',
  userPrivacy: 'auth/user/privacy',
};

const ACCOUNT = {
  search: (text) => `account/search/${encodeURIComponent(text)}`,
  followers: 'account/followers',
  followersByUser: (userId) => `account/followers/${userId}`,
  followings: 'account/followings',
  followingsByUser: (userId) => `account/followings/${userId}`,
  requests: 'account/requests',
  acceptRequest: (id) => `account/request/${id}/accept`,
  declineRequest: (id) => `account/request/${id}/decline`,
  recommended: 'account/recommended',
  follow: (userId) => `account/${userId}/follow`,
  getById: (userId) => `account/${userId}`,
  avatar: 'account/avatar',
};

const POSTS = {
  list: 'posts',
  create: 'posts',
  getById: (id) => `posts/${id}`,
  like: (id) => `posts/${id}/like`,
  comments: (id) => `posts/${id}/comments`,
};

export { AUTH, ACCOUNT, POSTS };
