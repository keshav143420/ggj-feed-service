import redisClient from '../redis/client';

export interface FeedItem {
  postId: string;
  authorId: string;
  content: string;
  createdAt: string;
}

const FEED_KEY_PREFIX = 'feed:';

export const feedService = {
  /**
   * Adds a post to a user's feed
   */
  async addPostToFeed(userId: string, post: FeedItem): Promise<void> {
    const key = `${FEED_KEY_PREFIX}${userId}`;
    // Store as JSON string, using timestamp as the score for sorting (ZADD)
    // Here we'll use LPUSH and LTRIM for a simpler timeline list, or ZADD for sorted set.
    // Let's use LPUSH for list and trim to keep only latest 1000 items
    const MAX_FEED_LENGTH = 1000;
    
    await redisClient.multi()
      .lpush(key, JSON.stringify(post))
      .ltrim(key, 0, MAX_FEED_LENGTH - 1)
      .exec();
  },

  /**
   * Gets the feed for a user
   */
  async getFeed(userId: string, page: number = 1, limit: number = 20): Promise<FeedItem[]> {
    const key = `${FEED_KEY_PREFIX}${userId}`;
    const start = (page - 1) * limit;
    const end = start + limit - 1;

    const items = await redisClient.lrange(key, start, end);
    return items.map(item => JSON.parse(item));
  },

  /**
   * Reconstruct feed (could be used if redis is cleared and we need to fetch from DB)
   * This is a placeholder for actual DB fetching in a real scenario
   */
  async cacheFeed(userId: string, posts: FeedItem[]): Promise<void> {
    const key = `${FEED_KEY_PREFIX}${userId}`;
    
    if (posts.length === 0) return;

    // Clear existing feed and add all posts
    const pipeline = redisClient.pipeline();
    pipeline.del(key);
    
    const stringifiedPosts = posts.map(p => JSON.stringify(p));
    pipeline.rpush(key, ...stringifiedPosts); // Add from oldest to newest if the array is sorted latest first?
    // Wait, if LPUSH is used for new posts, then index 0 is newest.
    // If posts array is [newest, older, oldest], we should RPUSH so index 0 is newest.
    
    await pipeline.exec();
  }
};
