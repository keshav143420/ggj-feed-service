import { consumer } from './client';
import { feedService, FeedItem } from '../services/feed.service';
import { connectionService } from '../services/connection.service';

export const startConsumer = async () => {
  await consumer.connect();
  console.log('Successfully connected to Kafka');

  await consumer.subscribe({ topic: 'new-post', fromBeginning: false });
  await consumer.subscribe({ topic: 'new-connection', fromBeginning: false });

  await consumer.run({
    eachMessage: async ({ topic, partition, message }) => {
      try {
        if (!message.value) return;
        const payload = JSON.parse(message.value.toString());

        switch (topic) {
          case 'new-post':
            await handleNewPost(payload);
            break;
          case 'new-connection':
            await handleNewConnection(payload);
            break;
          default:
            console.log(`Unhandled topic: ${topic}`);
        }
      } catch (error) {
        console.error(`Error processing message from topic ${topic}:`, error);
      }
    },
  });
};

const handleNewPost = async (payload: any) => {
  // Expected payload: { postId, authorId, content, createdAt }
  const { postId, authorId, content, createdAt } = payload;
  
  if (!postId || !authorId) {
    console.warn('Invalid new-post payload:', payload);
    return;
  }

  const post: FeedItem = { postId, authorId, content, createdAt: createdAt || new Date().toISOString() };

  // 1. Add to author's own feed
  await feedService.addPostToFeed(authorId, post);

  // 2. Fan-out: get followers and add to their feeds
  const followers = await connectionService.getFollowers(authorId);
  
  // Use Promise.all to add post to all followers' feeds concurrently
  // For massive fan-outs, this would typically be batched or pushed to a background worker queue
  // but for a scalable pattern in this scope, Promise.all is a good start.
  await Promise.all(
    followers.map(followerId => feedService.addPostToFeed(followerId, post))
  );

  console.log(`Fanned out post ${postId} to ${followers.length} followers.`);
};

const handleNewConnection = async (payload: any) => {
  // Expected payload: { followerId, followingId, action: 'follow' | 'unfollow' }
  const { followerId, followingId, action } = payload;

  if (!followerId || !followingId || !action) {
    console.warn('Invalid new-connection payload:', payload);
    return;
  }

  if (action === 'follow') {
    await connectionService.addFollower(followingId, followerId);
    console.log(`User ${followerId} is now following ${followingId}`);
  } else if (action === 'unfollow') {
    await connectionService.removeFollower(followingId, followerId);
    console.log(`User ${followerId} unfollowed ${followingId}`);
  }
};
