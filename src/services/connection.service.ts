import redisClient from '../redis/client';

const CONNECTIONS_KEY_PREFIX = 'connections:';

export const connectionService = {
  /**
   * Adds a follower to a user's connection list
   * (If user A follows user B, user A is a follower of user B. 
   * When user B posts, we need to add the post to user A's feed).
   * So we need a list of followers for a user.
   */
  async addFollower(userId: string, followerId: string): Promise<void> {
    const key = `${CONNECTIONS_KEY_PREFIX}${userId}:followers`;
    await redisClient.sadd(key, followerId);
  },

  /**
   * Removes a follower
   */
  async removeFollower(userId: string, followerId: string): Promise<void> {
    const key = `${CONNECTIONS_KEY_PREFIX}${userId}:followers`;
    await redisClient.srem(key, followerId);
  },

  /**
   * Gets all followers for a user
   */
  async getFollowers(userId: string): Promise<string[]> {
    const key = `${CONNECTIONS_KEY_PREFIX}${userId}:followers`;
    return redisClient.smembers(key);
  }
};
